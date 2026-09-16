import os
import time
import asyncio
import threading
import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter
from starlette.responses import StreamingResponse, JSONResponse

load_dotenv()

router = APIRouter(prefix="/cameras", tags=["Live Cameras"])


def create_status_frame(message: str, sub_message: str = "") -> bytes:
    """Generate a clean dark diagnostic frame with status text when stream is offline or initializing."""
    img = np.zeros((360, 640, 3), dtype=np.uint8)
    # Draw dark slate background
    img[:] = (24, 18, 15)  # BGR

    # Draw grid accent lines
    for x in range(0, 640, 40):
        cv2.line(img, (x, 0), (x, 360), (35, 26, 22), 1)
    for y in range(0, 360, 40):
        cv2.line(img, (0, y), (640, y), (35, 26, 22), 1)

    # Put message text
    cv2.putText(
        img,
        message,
        (40, 160),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        (0, 200, 255),
        2,
        cv2.LINE_AA,
    )
    if sub_message:
        cv2.putText(
            img,
            sub_message,
            (40, 205),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (180, 180, 180),
            1,
            cv2.LINE_AA,
        )

    ret, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 75])
    if ret:
        return buffer.tobytes()
    return b""


class Camera1Streamer:
    """
    Thread-safe MJPEG streamer for Camera 1 (Gate 1 Entry).
    Reads exclusively from the CAMERA_1_RTSP_URL environment variable.
    Maintains a single shared capture thread while clients are actively viewing.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._thread = None
        self._running = False
        self._client_count = 0
        self._latest_jpeg = None
        self._last_frame_time = 0.0
        self._is_connected = False

    def _get_rtsp_url(self) -> str:
        # Re-read from environment to support updates without full server rebuild
        load_dotenv()
        return (os.getenv("CAMERA_1_RTSP_URL") or "").strip()

    def _capture_loop(self):
        print("[CAMERA 1] Background capture worker started.")
        cap = None
        last_reconnect_attempt = 0.0

        while self._running:
            # If no clients are listening, clean up and exit thread to save bandwidth/resources
            with self._lock:
                if self._client_count <= 0:
                    self._running = False
                    print("[CAMERA 1] No active viewers. Stopping capture worker.")
                    break

            rtsp_url = self._get_rtsp_url()
            if not rtsp_url:
                with self._lock:
                    self._is_connected = False
                    self._latest_jpeg = create_status_frame(
                        "CAMERA 1: CAMERA_1_RTSP_URL not configured",
                        "Please set CAMERA_1_RTSP_URL in the local environment.",
                    )
                time.sleep(1.0)
                continue

            # Open or reconnect capture object
            if cap is None or not cap.isOpened():
                now = time.time()
                if now - last_reconnect_attempt < 3.0:
                    time.sleep(0.5)
                    continue

                last_reconnect_attempt = now
                print("[CAMERA 1] Connecting to RTSP stream...")
                cap = cv2.VideoCapture(rtsp_url)
                if not cap.isOpened():
                    print("[CAMERA 1 WARNING] Could not open RTSP source. Retrying in 3s...")
                    with self._lock:
                        self._is_connected = False
                        self._latest_jpeg = create_status_frame(
                            "CAMERA 1: Connecting to RTSP...",
                            "Waiting for camera response on local network.",
                        )
                    continue
                else:
                    # Best-effort OpenCV buffering hint to minimize latency if supported by backend
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    print("[CAMERA 1] Successfully connected to RTSP stream.")
                    with self._lock:
                        self._is_connected = True

            ret, frame = cap.read()
            if not ret or frame is None:
                print("[CAMERA 1 WARNING] Frame read failed. Reconnecting...")
                with self._lock:
                    self._is_connected = False
                    self._latest_jpeg = create_status_frame(
                        "CAMERA 1: Signal Lost",
                        "Attempting reconnection to camera...",
                    )
                if cap is not None:
                    cap.release()
                    cap = None
                time.sleep(1.0)
                continue

            # Successfully grabbed frame: encode to JPEG for MJPEG stream
            # Encode at quality 70 to ensure low latency and low CPU usage
            encode_ret, buffer = cv2.imencode(
                ".jpg",
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, 70],
            )
            if encode_ret:
                with self._lock:
                    self._latest_jpeg = buffer.tobytes()
                    self._last_frame_time = time.time()
                    self._is_connected = True

        if cap is not None:
            cap.release()
        with self._lock:
            self._running = False
            self._is_connected = False
        print("[CAMERA 1] Background capture worker exited.")

    def add_client(self):
        with self._lock:
            self._client_count += 1
            if not self._running or self._thread is None or not self._thread.is_alive():
                self._running = True
                self._thread = threading.Thread(
                    target=self._capture_loop,
                    daemon=True,
                )
                self._thread.start()

    def remove_client(self):
        with self._lock:
            self._client_count = max(0, self._client_count - 1)

    def get_latest_jpeg(self) -> bytes:
        with self._lock:
            return self._latest_jpeg

    def is_connected(self) -> bool:
        with self._lock:
            return self._is_connected


camera1_streamer = Camera1Streamer()


@router.get("/status/1")
async def get_camera_1_status():
    """
    Returns connection and configuration status of Camera 1 without revealing credentials.
    """
    rtsp_url = camera1_streamer._get_rtsp_url()
    return JSONResponse(
        {
            "camera_id": 1,
            "name": "Gate 1 (Entry Gate)",
            "configured": bool(rtsp_url),
            "connected": camera1_streamer.is_connected(),
        }
    )


@router.get("/stream/1")
async def stream_camera_1():
    """
    Provides an HTTP MJPEG stream (multipart/x-mixed-replace) of Camera 1 for the Admin Web console.
    """
    camera1_streamer.add_client()

    async def frame_generator():
        try:
            while True:
                jpeg_bytes = camera1_streamer.get_latest_jpeg()
                if jpeg_bytes:
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + jpeg_bytes
                        + b"\r\n"
                    )
                # Cap generator rate at ~25 fps on the async event loop
                await asyncio.sleep(0.04)
        except (GeneratorExit, asyncio.CancelledError):
            pass
        finally:
            camera1_streamer.remove_client()

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
