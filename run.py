import sys
import os
import socket
import webbrowser
import threading
import time
from pathlib import Path
import uvicorn

def get_lan_ip() -> str:
    """Detect the best local LAN IP address for mobile access."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Connect to a public DNS IP without sending actual packets
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def open_browser_delayed(url: str, delay: float = 1.2):
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception:
        pass

def main():
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", 8000))
    lan_ip = get_lan_ip()

    local_url = f"http://localhost:{port}"
    mobile_url = f"http://{lan_ip}:{port}"

    print("=" * 65)
    print("   OmniDownloader - Universal Video & Audio Downloader")
    print("=" * 65)
    print(f"   [PC Local Access]     {local_url}")
    print(f"   [Mobile (Same Wi-Fi)] {mobile_url}")
    print("=" * 65)
    print("   Open the Mobile link in your phone's browser (Chrome/Safari)")
    print("   (Ensure PC and Phone are connected to the same Wi-Fi)")
    print("   Press CTRL+C to quit")
    print("=" * 65)

    is_production = os.environ.get("RENDER") or os.environ.get("PORT") and "--no-browser" in sys.argv
    # Launch browser automatically on PC when running locally
    if "--no-browser" not in sys.argv and not os.environ.get("RENDER"):
        threading.Thread(target=open_browser_delayed, args=(local_url,), daemon=True).start()

    uvicorn.run("app.main:app", host=host, port=port, reload=not is_production, log_level="info")

if __name__ == "__main__":
    main()

