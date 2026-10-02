import os
import sys
import time
import re
import threading
import cv2
import easyocr
import requests
import base64
import numpy as np
from collections import Counter
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

# ================= Configuration =================
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/detections")
DEFAULT_ZONE = os.getenv("DEFAULT_ZONE", "Zone A")

# Camera IDs follow the backend camera-order convention: 01 = ENTRY, 02 = EXIT.
_requested_gate = os.getenv("GATE_TYPE", "ENTRY").upper()
CAMERA_ID = os.getenv("CAMERA_ID", "02" if _requested_gate == "EXIT" else "01")
GATE_TYPE = os.getenv("GATE_TYPE", "EXIT" if CAMERA_ID == "02" else "ENTRY").upper()

# Local snapshot storage directory — served statically by FastAPI at /snapshots
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOTS_DIR = os.path.join(_BACKEND_DIR, "data", "snapshots")
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

# Mac M1 Apple Silicon acceleration check
DEVICE = "mps" if os.uname().sysname == "Darwin" and os.uname().machine == "arm64" else "cpu"
print(f"[AI PIPELINE] Initializing on device: {DEVICE.upper()} (Apple Silicon M1 Acceleration)")

# Load OCR & Models
print("[AI PIPELINE] Loading EasyOCR (Thai + English)...")
reader = easyocr.Reader(['th', 'en'], gpu=(DEVICE == "mps" or DEVICE == "cuda"))

print("[AI PIPELINE] Loading YOLO Models...")
helmet_model = YOLO("helmet_model.pt")
# Optional general vehicle model if needed
try:
    vehicle_model = YOLO("yolov8n.pt")
except Exception:
    vehicle_model = None


class LatestFrameCapture:
    def __init__(self, source):
        self.cap = cv2.VideoCapture(source)
        self.latest_frame = None
        self.running = self.cap.isOpened()
        self.lock = threading.Lock()
        self.thread = None

        if self.running:
            self.thread = threading.Thread(target=self._reader, daemon=True)
            self.thread.start()

    def _reader(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                self.running = False
                break

            with self.lock:
                self.latest_frame = frame

    def read(self):
        with self.lock:
            if self.latest_frame is None:
                return False, None
            return True, self.latest_frame.copy()

    def isOpened(self):
        return self.running and self.cap.isOpened()

    def release(self):
        self.running = False

        # Wait for the capture thread to finish before releasing
        # the underlying OpenCV/FFmpeg capture object.
        if self.thread is not None and self.thread.is_alive():
            self.thread.join(timeout=2.0)

        if self.cap is not None:
            self.cap.release()


# Video Capture (webcam index, video file, or RTSP stream)
# Explicit sources win; otherwise select this process's camera, then the legacy webcam.
if len(sys.argv) > 1:
    source_value = sys.argv[1]
elif "VIDEO_SOURCE" in os.environ:
    source_value = os.environ["VIDEO_SOURCE"]
else:
    camera_source_key = {"01": "CAMERA_1_RTSP_URL", "02": "CAMERA_2_RTSP_URL"}.get(CAMERA_ID)
    source_value = ((os.getenv(camera_source_key) or "").strip() if camera_source_key else "") or "1"
video_source = int(source_value) if source_value.isdigit() else source_value

if isinstance(video_source, str) and video_source.lower().startswith(("rtsp://", "rtsps://")):
    print("[AI PIPELINE] Opening RTSP video source (credentials hidden)")
else:
    print(f"[AI PIPELINE] Opening video source: {video_source}")

cap = LatestFrameCapture(video_source)

if not cap.isOpened() and isinstance(video_source, int) and video_source != 0:
    print(f"[AI PIPELINE WARNING] Camera index {video_source} failed. Falling back to camera index 0...")
    video_source = 0
    cap = LatestFrameCapture(0)

if not cap.isOpened():
    print("[AI PIPELINE ERROR] Cannot open the configured video source (source hidden).", file=sys.stderr)
    print("Please make sure the camera, video file, or stream is available.")

# Thai Font for display
try:
    thai_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Thonburi.ttc", 30)
except Exception:
    thai_font = ImageFont.load_default()

# Stability Buffers
recent_plates = []
recent_helmets = []
recent_vehicle_types = []
stable_vehicle_type = None
last_submitted_plate = None
submitted_plates = set()  # Process-local history; never cleared when a plate disappears.
missing_plate_scans = 0
PLATE_CLEAR_SCANS = 5  # Re-arm only after plate disappears for several OCR scans

def clean_text(text: str) -> str:
    text = text.upper().replace(" ", "")
    return re.sub(r"[^ก-ฮ0-9A-Z-]", "", text)

def normalize_plate_key(plate: str) -> str:
    return clean_text(plate).replace("-", "")


def extract_thai_plate(texts: list) -> str:
    # 1. Motorcycle: 1กก + 2048
    for i in range(len(texts)):
        if re.fullmatch(r"[0-9]{1,2}[ก-ฮ]{1,3}", texts[i]):
            for j in range(i + 1, len(texts)):
                if re.fullmatch(r"[0-9]{3,4}", texts[j]):
                    return f"{texts[i]}-{texts[j]}"

    # 2. Car standard Thai: 1กข-9999 or กข-9999
    for text in texts:
        if re.fullmatch(r"[0-9]{1,2}[ก-ฮ]{1,3}[0-9]{3,4}", text):
            match = re.match(r"([0-9]{1,2}[ก-ฮ]{1,3})([0-9]{3,4})", text)
            return f"{match.group(1)}-{match.group(2)}"
        if re.fullmatch(r"[ก-ฮ]{1,3}[0-9]{3,4}", text):
            match = re.match(r"([ก-ฮ]{1,3})([0-9]{3,4})", text)
            return f"{match.group(1)}-{match.group(2)}"

    # 3. Two combined text chunks: ภบ + 9503
    for i in range(len(texts) - 1):
        candidate = texts[i] + texts[i + 1]
        if re.fullmatch(r"[0-9]{1,2}[ก-ฮ]{1,3}[0-9]{3,4}", candidate):
            return f"{texts[i]}-{texts[i+1]}"
        if re.fullmatch(r"[ก-ฮ]{1,3}[0-9]{3,4}", candidate):
            return f"{texts[i]}-{texts[i+1]}"

    # 4. Numeric truck plate: 2 digits + 4 digits
    # Examples: 10-1234, 31-5678, 70-2468, 82-4728
    for text in texts:
        match = re.fullmatch(r"([0-9]{2})-?([0-9]{4})", text)
        if match:
            return f"{match.group(1)}-{match.group(2)}"

    # OCR may return the two parts separately: "82" + "4728"
    for i in range(len(texts) - 1):
        if (
            re.fullmatch(r"[0-9]{2}", texts[i])
            and re.fullmatch(r"[0-9]{4}", texts[i + 1])
        ):
            return f"{texts[i]}-{texts[i + 1]}"

    return ""

def save_event_snapshot(frame, plate: str, gate_type: str, cam_id: str) -> tuple[str | None, str | None]:
    """
    Save exactly one JPEG snapshot of the current camera frame when an ENTRY or EXIT
    event is confirmed by the existing plate-stability mechanism.

    Returns (image_url, base64_uri) e.g. ("https://bucket.s3.amazonaws.com/snapshots/<filename>" or "/snapshots/<filename>")
    for inclusion in the detection payload and storage in database.
    """
    try:
        from storage import save_snapshot
        # Sanitize plate to safe ASCII/Thai filename characters
        safe_plate = re.sub(r"[^a-zA-Z0-9ก-ฮ]", "", plate) or "unknown"
        direction = gate_type.lower()
        unix_ts = int(time.time())
        filename = f"{direction}_cam{cam_id}_{unix_ts}_{safe_plate}.jpg"

        encode_ok, buffer = cv2.imencode(
            ".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85]
        )
        if not encode_ok:
            print(f"[SNAPSHOT ERROR] JPEG encode failed for plate {plate}. Detection will continue without photo.")
            return None, None

        img_bytes = buffer.tobytes()
        image_url = save_snapshot(img_bytes, filename)

        b64_encoded = base64.b64encode(img_bytes).decode('utf-8')
        b64_uri = f"data:image/jpeg;base64,{b64_encoded}"

        print(f"[SNAPSHOT] Saved {filename} -> {image_url}")
        return image_url, b64_uri
    except Exception as e:
        print(f"[SNAPSHOT ERROR] Could not save snapshot for plate {plate}: {e}. Detection will continue without photo.")
        return None, None


def post_detection_to_backend(
    plate: str,
    vehicle_type: str,
    helmet_detected: bool,
    zone: str = DEFAULT_ZONE,
    image_url: str | None = None,
    snapshot_base64: str | None = None,
):
    payload = {
        "license_plate": plate,
        "vehicle_type": vehicle_type,
        "helmet_detected": helmet_detected if vehicle_type == "motorcycle" else None,
        "gate_type": GATE_TYPE,
        "zone": zone,
        "camera_id": CAMERA_ID,
        "image_url": image_url,
        "snapshot_base64": snapshot_base64,
    }
    accepted = False
    try:
        res = requests.post(API_URL, json=payload, timeout=3.0)
        if res.status_code in [200, 201]:
            accepted = True
            submitted_plates.add(normalize_plate_key(plate))
            data = res.json()
            print(f"\n[API SUCCESS] Sent Detection -> Plate: {plate} | Type: {vehicle_type} | Violation: {data.get('violation')} | User: {data.get('matched_user')}")
        else:
            print(f"[API ERROR {res.status_code}] {res.text}")
    except Exception as e:
        print(
            f"[API NETWORK ERROR] Plate: {plate} | "
            f"Type: {vehicle_type} | "
            f"Could not send to {API_URL}: {e}"
        )

    return accepted

print("\n" + "="*60)
print(f"Smart Campus Parking AI Pipeline Running...")
print(f"Target API: {API_URL}")
print(f"Gate: {GATE_TYPE} | Zone: {DEFAULT_ZONE}")
print("Press 'q' in the video window to stop.")
print("="*60 + "\n")

frame_count = 0
HELMET_INTERVAL = 4  # Run helmet YOLO every 4 frames to reduce latency
VEHICLE_INTERVAL = 6  # Run general vehicle YOLO less often to reduce latency
OCR_INTERVAL = 8  # Run OCR every 8 frames for smooth FPS

current_display_plate = "Scanning..."
current_display_helmet = "Scanning..."

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        time.sleep(0.01)
        continue

    frame_count += 1
    detected_helmet_status = None

    # ---------- 1. YOLO Helmet Detection ----------
    if frame_count % HELMET_INTERVAL == 0:
        helmet_results = helmet_model(frame, conf=0.45, device=DEVICE, verbose=False)
        frame_found_person = False
        frame_has_no_helmet_violation = False

        for result in helmet_results:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = helmet_model.names[cls]

                if label in ["with_helmet", "no_helmet"]:
                    frame_found_person = True
                    has_helmet = (label == "with_helmet")
                    if label == "no_helmet":
                        frame_has_no_helmet_violation = True

                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    box_color = (0, 255, 0) if has_helmet else (0, 0, 255)
                    box_text = f"Helmet: {'YES' if has_helmet else 'NO'} ({conf:.2f})"

                    cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                    cv2.putText(frame, box_text, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)

        if frame_found_person:
            # Multi-rider rule: If ANY rider (driver or pillion) has no helmet, flag as False (Violation)
            overall_frame_helmet_ok = not frame_has_no_helmet_violation
            recent_helmets.append(overall_frame_helmet_ok)
            recent_helmets = recent_helmets[-10:]

    if recent_helmets:
        stable_helmet_state = Counter(recent_helmets).most_common(1)[0][0]
        current_display_helmet = "YES" if stable_helmet_state else "NO (Violation!)"
    else:
        stable_helmet_state = None

    # ---------- 2. Vehicle Type Detection ----------
    if vehicle_model is not None and frame_count % VEHICLE_INTERVAL == 0:
        vehicle_results = vehicle_model(
            frame,
            conf=0.40,
            imgsz=640,
            device=DEVICE,
            verbose=False
        )

        frame_vehicle_candidates = []

        for result in vehicle_results:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = vehicle_model.names[cls]

                if label == "motorcycle":
                    frame_vehicle_candidates.append(("motorcycle", conf))
                elif label in ["car", "truck", "bus"]:
                    # Backend currently uses car/motorcycle as its vehicle categories.
                    frame_vehicle_candidates.append(("car", conf))

        if frame_vehicle_candidates:
            detected_vehicle_type = max(
                frame_vehicle_candidates,
                key=lambda item: item[1]
            )[0]

            recent_vehicle_types.append(detected_vehicle_type)
            recent_vehicle_types = recent_vehicle_types[-8:]

            stable_vehicle_type = Counter(
                recent_vehicle_types
            ).most_common(1)[0][0]

    # ---------- 3. Plate OCR Detection ----------
    if frame_count % OCR_INTERVAL == 0:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 9, 75, 75)

        # Mask permanent VIGI overlays before OCR.
        h, w = gray.shape[:2]

        # Top-left: date/time overlay
        cv2.rectangle(
            gray,
            (0, 0),
            (int(w * 0.42), int(h * 0.12)),
            0,
            -1
        )

        # Bottom-left: VIGI model / firmware watermark
        cv2.rectangle(
            gray,
            (0, int(h * 0.88)),
            (int(w * 0.42), h),
            0,
            -1
        )

        ocr_results = reader.readtext(gray)

        cleaned_tokens = []
        frame_height = frame.shape[0]

        for bbox, text, conf in ocr_results:
            if conf > 0.35:
                cleaned = clean_text(text)

                if not cleaned:
                    continue

                # Ignore numeric-only OCR from the top of the image.
                # This prevents the VIGI date/time overlay from being
                # mistaken for numeric truck license plates.
                bbox_center_y = sum(point[1] for point in bbox) / len(bbox)

                if (
                    bbox_center_y < frame_height * 0.20
                    and re.fullmatch(r"[0-9-]+", cleaned)
                ):
                    continue

                cleaned_tokens.append(cleaned)

        plate = extract_thai_plate(cleaned_tokens)

        if plate:
            missing_plate_scans = 0

            recent_plates.append(plate)
            recent_plates = recent_plates[-8:]

            stable_plate = Counter(recent_plates).most_common(1)[0][0]
            current_display_plate = stable_plate

            # Keep OCR/display re-arming separate from process-lifetime submission history.
            if (
                stable_plate != last_submitted_plate
                and normalize_plate_key(stable_plate) not in submitted_plates
                and recent_plates.count(stable_plate) >= 2
            ):
                # Vehicle type must come from an actual YOLO vehicle detection.
                # Do not silently classify an unknown vehicle as a car.
                if stable_vehicle_type is None:
                    print(
                        f"[AI WAITING] Plate: {stable_plate} | "
                        "Vehicle type not detected yet"
                    )
                else:
                    v_type = stable_vehicle_type
                    is_motorcycle = (v_type == "motorcycle")

                    zone_target = (
                        "Zone C (Motorcycle Only)"
                        if is_motorcycle
                        else DEFAULT_ZONE
                    )

                    # Capture one JPEG snapshot for this event.
                    # save_event_snapshot() is fully exception-safe:
                    # it always returns None on any error so the detection
                    # below is never skipped due to a photo failure.
                    event_image_url, event_b64 = save_event_snapshot(
                        frame=frame,
                        plate=stable_plate,
                        gate_type=GATE_TYPE,
                        cam_id=CAMERA_ID,
                    )

                    accepted = post_detection_to_backend(
                        plate=stable_plate,
                        vehicle_type=v_type,
                        helmet_detected=stable_helmet_state if is_motorcycle else None,
                        zone=zone_target,
                        image_url=event_image_url,
                        snapshot_base64=event_b64,
                    )

                    if accepted:
                        last_submitted_plate = stable_plate

        else:
            missing_plate_scans += 1

            if missing_plate_scans >= PLATE_CLEAR_SCANS:
                recent_plates.clear()
                last_submitted_plate = None
                current_display_plate = "Scanning..."

    # ---------- 3. Render HUD Banner ----------
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(frame_rgb)
    draw = ImageDraw.Draw(pil_img)

    # Top-right overlay bar to avoid the camera's built-in timestamp
    hud_width = 440
    margin = 10
    hud_left = max(margin, pil_img.width - hud_width - margin)
    hud_right = pil_img.width - margin

    draw.rectangle(
        [(hud_left, 10), (hud_right, 95)],
        fill=(20, 20, 20, 200),
        outline=(0, 200, 255),
        width=2
    )
    draw.text(
        (hud_left + 10, 15),
        f"Plate: {current_display_plate}",
        font=thai_font,
        fill=(255, 255, 0)
    )
    draw.text(
        (hud_left + 10, 55),
        f"Helmet: {current_display_helmet}",
        font=thai_font,
        fill=(0, 255, 0) if "YES" in current_display_helmet else (255, 80, 80)
    )

    frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    cv2.imshow("Smart Campus AI Detection Pipeline (M1 Accelerated)", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
