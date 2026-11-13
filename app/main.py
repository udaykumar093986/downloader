import os
import json
import socket
import asyncio
import subprocess
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse, Response, HTMLResponse

from app.models import InfoRequest, DownloadRequest, VideoInfoResponse, DownloadProgress
from app.downloader import (
    get_video_info,
    clean_error_message,
    start_download_task,
    execute_download,
    tasks,
    DOWNLOADS_DIR,
    list_downloaded_files,
    delete_downloaded_file,
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="Universal Online Video Downloader",
    description="High-performance online video & audio downloader powered by yt-dlp & FFmpeg",
    version="1.0.0",
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dedicated thread pool for heavy downloads and metadata extractions
executor = ThreadPoolExecutor(max_workers=5)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "downloads_count": len(list_downloaded_files())}


@app.get("/api/network-info")
async def get_network_info():
    """Returns local LAN IP and mobile connection URL for QR code / direct access."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        lan_ip = s.getsockname()[0]
        s.close()
    except Exception:
        lan_ip = "127.0.0.1"

    port = 8000
    mobile_url = f"http://{lan_ip}:{port}"
    return {
        "lan_ip": lan_ip,
        "port": port,
        "mobile_url": mobile_url,
    }


@app.post("/api/info", response_model=VideoInfoResponse)
async def fetch_info(req: InfoRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="A valid video URL must be provided.")
    
    url = req.url.strip()
    loop = asyncio.get_event_loop()
    try:
        info = await loop.run_in_executor(executor, get_video_info, url, req.proxy)
        return info
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        cleaned = clean_error_message(e)
        raise HTTPException(
            status_code=400,
            detail=cleaned
        )


@app.post("/api/download")
async def start_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="A valid video URL is required.")

    task_id = start_download_task(req)
    
    # Run in background worker
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, execute_download, task_id, req)

    return {"task_id": task_id, "status": "queued"}


@app.get("/api/progress/{task_id}")
async def get_task_progress(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Download task not found.")
    return task


@app.get("/api/progress/{task_id}/events")
async def stream_task_progress(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Download task not found.")

    async def event_generator():
        last_percent = -1.0
        last_status = ""
        while True:
            cur_task = tasks.get(task_id)
            if not cur_task:
                yield f"data: {json.dumps({'status': 'failed', 'error': 'Task lost'})}\n\n"
                break

            data = cur_task.model_dump()
            yield f"data: {json.dumps(data)}\n\n"

            if cur_task.status in ["completed", "failed"]:
                break

            await asyncio.sleep(0.4)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/files/{filename}")
async def download_file(filename: str):
    # Prevent path traversal
    safe_name = Path(filename).name
    filepath = DOWNLOADS_DIR / safe_name
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File not found or already deleted.")

    return FileResponse(
        path=filepath,
        filename=safe_name,
        media_type="application/octet-stream",
    )


@app.get("/api/history")
async def get_history():
    return list_downloaded_files()


@app.delete("/api/history/{filename}")
async def delete_file(filename: str):
    success = delete_downloaded_file(filename)
    if not success:
        raise HTTPException(status_code=404, detail="File not found.")
    return {"success": True, "message": f"{filename} deleted"}


@app.post("/api/open-folder")
async def open_downloads_folder():
    try:
        folder_str = str(DOWNLOADS_DIR)
        if os.name == "nt":
            os.startfile(folder_str)
        else:
            subprocess.Popen(["xdg-open", folder_str])
        return {"success": True, "path": folder_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/proxy-page")
async def proxy_web_page(url: str):
    """Safely proxies a webpage to render inside an iframe by stripping restrictive X-Frame-Options headers."""
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="A valid http/https URL is required.")

    req_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, verify=False) as client:
            resp = await client.get(url, headers=req_headers)
            content_type = resp.headers.get("content-type", "").lower()

            if "text/html" in content_type:
                html = resp.text
                final_url = str(resp.url)
                # Inject a base tag so relative links, images, and styles load properly from the original domain
                base_tag = f'<base href="{final_url}">'
                if "<head>" in html:
                    html = html.replace("<head>", f"<head>{base_tag}", 1)
                elif "<HEAD>" in html:
                    html = html.replace("<HEAD>", f"<HEAD>{base_tag}", 1)
                else:
                    html = f"{base_tag}{html}"

                return HTMLResponse(
                    content=html,
                    headers={
                        "X-Frame-Options": "ALLOWALL",
                        "Content-Security-Policy": "frame-ancestors *",
                    },
                )
            else:
                return Response(
                    content=resp.content,
                    media_type=content_type or "text/plain",
                    headers={"X-Frame-Options": "ALLOWALL"},
                )
    except Exception as e:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #94a3b8; padding: 2rem; text-align: center; }}
            .btn {{ display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; }}
          </style>
        </head>
        <body>
          <h3 style="color:#f87171; margin-bottom: 0.5rem;">Webpage Preview Notice</h3>
          <p style="font-size: 13px;">This website restricts embedded previews ({str(e)}).</p>
          <a href="{url}" target="_blank" rel="noopener noreferrer" class="btn">Open Webpage in New Tab</a>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=200)


# Static files & SPA root
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def root():
    index_file = STATIC_DIR / "index.html"
    return FileResponse(index_file)
