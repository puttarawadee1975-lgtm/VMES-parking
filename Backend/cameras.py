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

PREVIEW_FRAME_INTERVAL = 0.1  # Encode at most 10 preview frames/second.

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


class CameraStreamer:
    """
    Thread-safe MJPEG streamer with independent state for each camera.
    Reads exclusively from the configured environment variable.
    Maintains a single shared capture thread while clients are actively viewing.
    """

    def __init__(self, camera_id: int, rtsp_env_var: str):
        self.camera_id = camera_id
        self.rtsp_env_var = rtsp_env_var
        self._lock = threading.Lock()
        self._thread = None
        self._running = False
        self._client_count = 0
        self._latest_jpeg = None
        self._frame_sequence = 0
        self._last_frame_time = 0.0
        self._is_connected = False

    def _get_rtsp_url(self) -> str:
        # Re-read from environment to support updates without full server rebuild
        load_dotenv()
        return (os.getenv(self.rtsp_env_var) or "").strip()

    def _capture_loop(self):
        print(f"[CAMERA {self.camera_id}] Background capture worker started.")
        cap = None
        last_reconnect_attempt = 0.0
        next_encode_time = 0.0

        while self._running:
            # If no clients are listening, clean up and exit thread to save bandwidth/resources
            with self._lock:
                if self._client_count <= 0:
                    self._running = False
                    print(f"[CAMERA {self.camera_id}] No active viewers. Stopping capture worker.")
                    break

            # Resolve configuration only when opening/reconnecting, not for every frame.
            if cap is None or not cap.isOpened():
                rtsp_url = self._get_rtsp_url()
                if not rtsp_url:
                    with self._lock:
                        self._is_connected = False
                        self._latest_jpeg = create_status_frame(
                            f"CAMERA {self.camera_id}: {self.rtsp_env_var} not configured",
                            f"Please set {self.rtsp_env_var} in the local environment.",
                        )
                        self._frame_sequence += 1
                    time.sleep(1.0)
                    continue

                now = time.time()
                if now - last_reconnect_attempt < 3.0:
                    time.sleep(0.5)
                    continue

                last_reconnect_attempt = now
                print(f"[CAMERA {self.camera_id}] Connecting to RTSP stream...")
                cap = cv2.VideoCapture(rtsp_url)
                if not cap.isOpened():
                    print(f"[CAMERA {self.camera_id} WARNING] Could not open RTSP source. Retrying in 3s...")
                    with self._lock:
                        self._is_connected = False
                        self._latest_jpeg = create_status_frame(
                            f"CAMERA {self.camera_id}: Connecting to RTSP...",
                            "Waiting for camera response on local network.",
                        )
                        self._frame_sequence += 1
                    continue
                else:
                    # Best-effort OpenCV buffering hint to minimize latency if supported by backend
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    print(f"[CAMERA {self.camera_id}] Successfully connected to RTSP stream.")
                    with self._lock:
                        self._is_connected = True

            ret, frame = cap.read()
            if not ret or frame is None:
                print(f"[CAMERA {self.camera_id} WARNING] Frame read failed. Reconnecting...")
                with self._lock:
                    self._is_connected = False
                    self._latest_jpeg = create_status_frame(
                        f"CAMERA {self.camera_id}: Signal Lost",
                        "Attempting reconnection to camera...",
                    )
                    self._frame_sequence += 1
                if cap is not None:
                    cap.release()
                    cap = None
                time.sleep(1.0)
                continue

            # Keep reading between encodes to avoid accumulating stale camera frames.
            now = time.monotonic()
            if now < next_encode_time:
                continue
            next_encode_time = now + PREVIEW_FRAME_INTERVAL

            # Controlled full-resolution preview test: encode the original capture frame.
            encode_ret, buffer = cv2.imencode(
                ".jpg",
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, 70],
            )
            if encode_ret:
                with self._lock:
                    self._latest_jpeg = buffer.tobytes()
                    self._frame_sequence += 1
                    self._last_frame_time = time.time()
                    self._is_connected = True

        if cap is not None:
            cap.release()
        with self._lock:
            self._running = False
            self._is_connected = False
        print(f"[CAMERA {self.camera_id}] Background capture worker exited.")

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

    def get_latest_frame(self):
        """Return an atomic snapshot so each viewer can skip already-sent frames."""
        with self._lock:
            return self._frame_sequence, self._latest_jpeg

    def is_connected(self) -> bool:
        with self._lock:
            return self._is_connected


class Camera1Streamer(CameraStreamer):
    """Retain the existing Camera 1 constructor and configuration."""

    def __init__(self):
        super().__init__(1, "CAMERA_1_RTSP_URL")


camera1_streamer = Camera1Streamer()
camera2_streamer = CameraStreamer(2, "CAMERA_2_RTSP_URL")


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
    return create_camera_stream(camera1_streamer)


def create_camera_stream(streamer: CameraStreamer):
    streamer.add_client()

    async def frame_generator():
        last_sequence = -1
        try:
            while True:
                sequence, jpeg_bytes = streamer.get_latest_frame()
                if jpeg_bytes and sequence != last_sequence:
                    last_sequence = sequence
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + jpeg_bytes
                        + b"\r\n"
                    )
                # Check for fresh frames without resending an unchanged JPEG.
                await asyncio.sleep(0.04)
        except (GeneratorExit, asyncio.CancelledError):
            pass
        finally:
            streamer.remove_client()

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/status/2")
async def get_camera_2_status():
    """Return EXIT camera status without revealing its source."""
    return JSONResponse(
        {
            "camera_id": 2,
            "name": "Gate 2 (Exit Gate)",
            "configured": bool(camera2_streamer._get_rtsp_url()),
            "connected": camera2_streamer.is_connected(),
        }
    )


@router.get("/stream/2")
async def stream_camera_2():
    """Provide the independent EXIT camera MJPEG stream."""
    return create_camera_stream(camera2_streamer)
