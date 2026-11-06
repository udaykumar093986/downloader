import os
import re
import math
import time
import uuid
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import yt_dlp

from app.models import (
    VideoInfoResponse,
    FormatOption,
    DownloadRequest,
    DownloadProgress,
)

logger = logging.getLogger("downloader")
BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# In-memory store for task progress
tasks: Dict[str, DownloadProgress] = {}


def format_bytes(b: Optional[float]) -> Optional[str]:
    if b is None or math.isnan(b) or b < 0:
        return None
    if b < 1024:
        return f"{int(b)} B"
    elif b < 1024 * 1024:
        return f"{b / 1024:.1f} KB"
    elif b < 1024 * 1024 * 1024:
        return f"{b / (1024 * 1024):.1f} MB"
    else:
        return f"{b / (1024 * 1024 * 1024):.2f} GB"


def format_duration(seconds: Optional[int]) -> Optional[str]:
    if seconds is None or seconds < 0:
        return None
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def clean_error_message(err: Any) -> str:
    raw = str(err)
    # Strip ANSI escape sequences and control characters
    text = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", raw)
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", text)
    text = re.sub(r"^(?:ERROR:\s*)+", "", text.strip())

    # Detect network / ISP RST blocks
    if (
        "10054" in text
        or "forcibly closed" in text
        or "ConnectionResetError" in text
        or "Connection reset" in text
    ):
        return (
            "Connection was forcibly closed by your local ISP or firewall (WinError 10054). "
            "This domain is blocked or filtered on your local network. "
            "Solution: Turn on a VPN (e.g. Cloudflare 1.1.1.1 WARP, ProtonVPN) or configure an HTTP/SOCKS5 Proxy in the app's Proxy Settings."
        )
    if "10060" in text or "timed out" in text.lower():
        return (
            "Connection timed out. The remote server or ISP did not respond in time. "
            "Please check your internet connection, retry, or use a VPN/Proxy."
        )
    if "10061" in text or "actively refused" in text.lower():
        return "Connection was actively refused by the server (WinError 10061). Please check the URL or proxy."
    if "HTTP Error 403" in text or "Forbidden" in text:
        return (
            "Access Forbidden (HTTP 403). The website may require login/cookies, bot verification, "
            "or is blocking requests from this IP region."
        )
    if "HTTP Error 404" in text:
        return "Video not found (HTTP 404). Please verify that the link is correct and active."

    return text.strip()


def get_ydl_base_opts(proxy: Optional[str] = None) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "ignoreerrors": False,
        "logtostderr": False,
        "no_color": True,
        "socket_timeout": 30,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    }
    if proxy and proxy.strip():
        opts["proxy"] = proxy.strip()
    return opts


def get_video_info(url: str, proxy: Optional[str] = None) -> VideoInfoResponse:
    ydl_opts = get_ydl_base_opts(proxy)
    ydl_opts.update({
        "extract_flat": "in_playlist",
        "skip_download": True,
    })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as e:
            cleaned = clean_error_message(e)
            logger.error(f"Error extracting info for {url}: {cleaned}")
            raise ValueError(cleaned)

    if not info:
        raise ValueError("No video information could be found.")

    # If it's a playlist or multiple entries, take the first entry
    if "entries" in info and info["entries"]:
        info = info["entries"][0]

    title = info.get("title") or "Unknown Title"
    uploader = info.get("uploader") or info.get("creator") or info.get("channel") or "Unknown Creator"
    uploader_url = info.get("uploader_url") or info.get("channel_url")
    duration = info.get("duration")
    duration_str = format_duration(duration)
    thumbnail = info.get("thumbnail")
    webpage_url = info.get("webpage_url") or url
    extractor = info.get("extractor") or "Generic"
    extractor_key = info.get("extractor_key") or "generic"

    raw_formats = info.get("formats", [])

    # Process and build clean quality options
    video_formats: List[FormatOption] = []
    audio_formats: List[FormatOption] = []

    # Standard preset resolutions to offer
    standard_resolutions = [
        ("4K (2160p)", "2160"),
        ("2K (1440p)", "1440"),
        ("Full HD (1080p)", "1080"),
        ("HD (720p)", "720"),
        ("SD (480p)", "480"),
        ("360p", "360"),
    ]

    # Find highest available height in raw formats
    max_height = 0
    for f in raw_formats:
        h = f.get("height")
        if h and isinstance(h, (int, float)) and h > max_height:
            max_height = int(h)

    # Always provide "Best Available"
    video_formats.append(
        FormatOption(
            format_id="best",
            label="Best Available Quality (Automatic)",
            ext="mp4",
            resolution="Auto / Best",
            filesize=None,
            filesize_str="Varies",
            note="Highest video + highest audio combined",
            format_type="video",
        )
    )

    # Add resolutions up to max_height (or all standards if max_height unknown)
    for label, res in standard_resolutions:
        res_int = int(res)
        if max_height == 0 or max_height >= res_int or res_int <= 720:
            video_formats.append(
                FormatOption(
                    format_id=res,
                    label=label,
                    ext="mp4",
                    resolution=f"{res}p",
                    filesize=None,
                    filesize_str=None,
                    note=f"Max {res}p with best stereo audio",
                    format_type="video",
                )
            )

    # Audio presets
    audio_formats.append(
        FormatOption(
            format_id="mp3_320",
            label="MP3 High Quality (320 kbps)",
            ext="mp3",
            resolution="320 kbps",
            filesize=None,
            filesize_str=None,
            note="Best audio fidelity, converted to MP3",
            format_type="audio",
        )
    )
    audio_formats.append(
        FormatOption(
            format_id="mp3_192",
            label="MP3 Standard (192 kbps)",
            ext="mp3",
            resolution="192 kbps",
            filesize=None,
            filesize_str=None,
            note="Great balance between file size & quality",
            format_type="audio",
        )
    )
    audio_formats.append(
        FormatOption(
            format_id="mp3_128",
            label="MP3 Compact (128 kbps)",
            ext="mp3",
            resolution="128 kbps",
            filesize=None,
            filesize_str=None,
            note="Smallest file size",
            format_type="audio",
        )
    )
    audio_formats.append(
        FormatOption(
            format_id="m4a",
            label="Original M4A / AAC (Lossless extraction)",
            ext="m4a",
            resolution="Lossless/Original",
            filesize=None,
            filesize_str=None,
            note="Direct stream copy if available",
            format_type="audio",
        )
    )

    return VideoInfoResponse(
        title=title,
        uploader=uploader,
        uploader_url=uploader_url,
        duration=duration,
        duration_str=duration_str,
        thumbnail=thumbnail,
        webpage_url=webpage_url,
        extractor=extractor,
        extractor_key=extractor_key,
        video_formats=video_formats,
        audio_formats=audio_formats,
    )


def start_download_task(request: DownloadRequest) -> str:
    task_id = str(uuid.uuid4())
    tasks[task_id] = DownloadProgress(
        task_id=task_id,
        status="queued",
        percent=0.0,
        title="Initializing download...",
    )
    return task_id


def execute_download(task_id: str, request: DownloadRequest):
    progress = tasks.get(task_id)
    if not progress:
        return

    progress.status = "downloading"
    final_filepath: Optional[Path] = None

    def progress_hook(d: dict):
        nonlocal final_filepath
        status = d.get("status")
        if status == "downloading":
            downloaded = d.get("downloaded_bytes", 0)
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            if total and total > 0:
                percent = round((downloaded / total) * 100, 1)
            else:
                percent_str = d.get("_percent_str", "").replace("%", "").strip()
                try:
                    percent = float(percent_str) if percent_str else 0.0
                except ValueError:
                    percent = 0.0

            speed = d.get("speed")
            eta = d.get("eta")

            progress.percent = percent
            progress.speed_str = f"{format_bytes(speed)}/s" if speed else "Calculating..."
            progress.eta_str = f"{int(eta)}s" if eta else "Calculating..."
            progress.downloaded_str = format_bytes(downloaded)
            progress.total_str = format_bytes(total)
            progress.status = "downloading"

        elif status == "finished":
            progress.status = "processing"
            progress.percent = 99.0
            filename = d.get("filename")
            if filename:
                final_filepath = Path(filename)

    def postprocessor_hook(d: dict):
        nonlocal final_filepath
        if d.get("status") == "finished":
            fn = d.get("info_dict", {}).get("filepath") or d.get("filename")
            if fn:
                final_filepath = Path(fn)

    out_tmpl = str(DOWNLOADS_DIR / "%(title).150B-%(id)s.%(ext)s")
    ydl_opts = get_ydl_base_opts(request.proxy)
    ydl_opts.update({
        "outtmpl": out_tmpl,
        "progress_hooks": [progress_hook],
        "postprocessor_hooks": [postprocessor_hook],
        "windowsfilenames": True,
        "restrictfilenames": False,
        "overwrites": True,
    })

    # Configure formats according to request
    if request.format_type == "audio":
        if request.quality == "m4a":
            ydl_opts.update({
                "format": "bestaudio[ext=m4a]/bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "m4a",
                    }
                ],
            })
        else:
            # MP3 with bitrate
            bitrate_map = {
                "mp3_320": "320",
                "mp3_192": "192",
                "mp3_128": "128",
            }
            bitrate = bitrate_map.get(request.quality, "320")
            ydl_opts.update({
                "format": "bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": bitrate,
                    }
                ],
            })
    else:
        # Video format configuration
        quality = request.quality
        if quality == "best" or quality == "auto":
            ydl_opts.update({
                "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
                "merge_output_format": "mp4",
            })
        else:
            try:
                h_max = int(quality)
                ydl_opts.update({
                    "format": (
                        f"bestvideo[height<={h_max}][ext=mp4]+bestaudio[ext=m4a]/"
                        f"bestvideo[height<={h_max}]+bestaudio/"
                        f"best[height<={h_max}]/best"
                    ),
                    "merge_output_format": "mp4",
                })
            except ValueError:
                ydl_opts.update({
                    "format": "bestvideo+bestaudio/best",
                    "merge_output_format": "mp4",
                })

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=True)
            if info:
                progress.title = info.get("title") or "Downloaded Media"

            # Determine actual produced file
            if final_filepath and final_filepath.exists():
                actual_file = final_filepath
            else:
                expected_fn = ydl.prepare_filename(info)
                # Check with actual extension after postprocessing
                if request.format_type == "audio":
                    ext = "m4a" if request.quality == "m4a" else "mp3"
                    candidate = Path(expected_fn).with_suffix(f".{ext}")
                else:
                    candidate = Path(expected_fn).with_suffix(".mp4")

                if candidate.exists():
                    actual_file = candidate
                elif Path(expected_fn).exists():
                    actual_file = Path(expected_fn)
                else:
                    # Search recent files in downloads folder
                    candidates = sorted(
                        DOWNLOADS_DIR.glob(f"*{info.get('id', '')}*"),
                        key=lambda p: p.stat().st_mtime,
                        reverse=True,
                    )
                    actual_file = candidates[0] if candidates else None

            if actual_file and actual_file.exists():
                safe_name = actual_file.name
                progress.filename = safe_name
                progress.download_url = f"/api/files/{safe_name}"
                progress.percent = 100.0
                progress.status = "completed"
            else:
                progress.status = "completed"
                progress.percent = 100.0

    except Exception as e:
        cleaned = clean_error_message(e)
        logger.error(f"Download failed for {request.url}: {cleaned}", exc_info=True)
        progress.status = "failed"
        progress.error = cleaned


def list_downloaded_files() -> List[dict]:
    results = []
    if not DOWNLOADS_DIR.exists():
        return results

    for item in sorted(DOWNLOADS_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if item.is_file() and not item.name.endswith(".part") and not item.name.endswith(".ytdl"):
            stat = item.stat()
            ext = item.suffix.lower().lstrip(".")
            file_type = "audio" if ext in ["mp3", "m4a", "wav", "flac", "ogg", "aac"] else "video"
            results.append({
                "filename": item.name,
                "size_bytes": stat.st_size,
                "size_str": format_bytes(stat.st_size),
                "created_at": stat.st_mtime,
                "created_str": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_mtime)),
                "type": file_type,
                "ext": ext,
                "download_url": f"/api/files/{item.name}",
            })
    return results


def delete_downloaded_file(filename: str) -> bool:
    safe_name = Path(filename).name  # Prevent directory traversal
    target = DOWNLOADS_DIR / safe_name
    if target.exists() and target.is_file():
        target.unlink()
        return True
    return False
