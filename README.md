# OmniDownloader - Universal Online Video & Audio Downloader

A modern, fast, and responsive web application to download videos and audio from virtually any online source (YouTube, Instagram, TikTok, X / Twitter, Facebook, Reddit, Vimeo, Twitch, and 1,000+ others) with full resolution control (up to 4K) and MP3 audio extraction.

Powered by **FastAPI**, **yt-dlp**, and **FFmpeg**.

---

## Features

- **Universal Platform Support**: Works with YouTube, Instagram Reels/Posts, TikTok, X (Twitter), Facebook, Reddit, Vimeo, Twitch clips, and direct media URLs.
- **Quality & Format Selection**:
  - **Video**: 4K (2160p), 1440p, 1080p Full HD, 720p HD, 480p, 360p, or Best Available (MP4).
  - **Audio**: MP3 (320kbps High Quality, 192kbps Standard, 128kbps Compact) or original M4A/AAC.
- **Rich Media Preview**: Instant metadata extraction showing video title, thumbnail, creator, duration, and platform badge.
- **Real-Time Progress Tracking**: Live progress bar with download percentage, download speed (MB/s), estimated time remaining (ETA), and FFmpeg conversion status via Server-Sent Events (SSE).
- **Download Management & History**: View all completed downloads, download directly through browser, open the local downloads folder with one click, or delete downloaded files.
- **One-Click Startup**: Double-click `start.bat` to launch and open in browser.

---

## Quick Start

### 1. Requirements
- Python 3.10+ (Python 3.14+ installed)
- FFmpeg (installed and added to PATH)

### 2. Launch the App
Simply double-click:
```bat
start.bat
```
Or run from terminal:
```powershell
.\.venv\Scripts\python.exe run.py
```

The web interface will automatically open in your browser at:
**http://localhost:8000**

### 3. Use on Mobile Phone (Same Wi-Fi)
1. Ensure your phone and your PC are connected to the same Wi-Fi network.
2. In the PC web interface, click **"Use on Phone"** in the top navigation bar to display the QR code.
3. Scan the QR code with your phone camera or visit:
   **http://<YOUR-PC-IP>:8000** (e.g. `http://192.168.0.3:8000`)
4. Any video downloaded on your phone saves directly to your phone's storage.

---

## Project Structure

```
downloader/
├── app/
│   ├── main.py          # FastAPI web server, REST API, SSE stream
│   ├── downloader.py    # yt-dlp extraction & download engine
│   ├── models.py        # Pydantic schemas
│   └── static/          # Web UI assets
│       ├── index.html   # Main dashboard
│       ├── app.js       # Dynamic frontend logic & SSE stream client
│       └── style.css    # Custom styles & glassmorphic accents
├── downloads/           # Saved media files directory
├── requirements.txt     # Python dependencies
├── run.py               # Application launcher
├── start.bat            # Windows quick-launch script
└── README.md            # Documentation
```

---

## API Endpoints

- `POST /api/info` - Inspect a video URL and return available formats and metadata
- `POST /api/download` - Trigger a background download task
- `GET /api/progress/{task_id}/events` - Real-time SSE stream for download progress
- `GET /api/files/{filename}` - Download the completed file
- `GET /api/history` - List all downloaded files
- `DELETE /api/history/{filename}` - Delete a file from disk
- `POST /api/open-folder` - Open the downloads directory in Windows File Explorer
