from pydantic import BaseModel, HttpUrl
from typing import Optional, List

class InfoRequest(BaseModel):
    url: str
    proxy: Optional[str] = None

class FormatOption(BaseModel):
    format_id: str
    label: str
    ext: str
    resolution: Optional[str] = None
    filesize: Optional[int] = None
    filesize_str: Optional[str] = None
    note: Optional[str] = None
    format_type: str  # "video" or "audio"

class VideoInfoResponse(BaseModel):
    title: str
    uploader: Optional[str] = None
    uploader_url: Optional[str] = None
    duration: Optional[int] = None
    duration_str: Optional[str] = None
    thumbnail: Optional[str] = None
    webpage_url: str
    extractor: str
    extractor_key: str
    video_formats: List[FormatOption] = []
    audio_formats: List[FormatOption] = []

class DownloadRequest(BaseModel):
    url: str
    format_type: str = "video"  # "video" or "audio"
    quality: str = "best"       # "best", "1080", "720", "480", "mp3_320", etc.
    custom_format_id: Optional[str] = None
    proxy: Optional[str] = None

class DownloadProgress(BaseModel):
    task_id: str
    status: str                 # "queued", "downloading", "processing", "completed", "failed"
    percent: float = 0.0
    speed_str: Optional[str] = None
    eta_str: Optional[str] = None
    downloaded_str: Optional[str] = None
    total_str: Optional[str] = None
    filename: Optional[str] = None
    download_url: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None
