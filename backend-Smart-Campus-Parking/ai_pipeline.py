import os
import sys
import time
import re
import threading
import cv2
import easyocr
import requests
import numpy as np
from collections import Counter
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont

# ================= Configuration =================
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/detections")
GATE_TYPE = os.getenv("GATE_TYPE", "ENTRY")  # ENTRY or EXIT
DEFAULT_ZONE = os.getenv("DEFAULT_ZONE", "Zone A (Building 1 - Car)")

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
source_value = sys.argv[1] if len(sys.argv) > 1 else os.getenv("VIDEO_SOURCE", "1")
video_source = int(source_value) if source_value.isdigit() else source_value

if isinstance(video_source, str) and video_source.lower().startswith("rtsp://"):
    print("[AI PIPELINE] Opening RTSP video source (credentials hidden)")
else:
    print(f"[AI PIPELINE] Opening video source: {video_source}")

cap = LatestFrameCapture(video_source)

if not cap.isOpened() and isinstance(video_source, int) and video_source != 0:
    print(f"[AI PIPELINE WARNING] Camera index {video_source} failed. Falling back to camera index 0...")
    video_source = 0
    cap = LatestFrameCapture(0)

if not cap.isOpened():
    print(f"[AI PIPELINE ERROR] Cannot open video source: {video_source}", file=sys.stderr)
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
missing_plate_scans = 0
PLATE_CLEAR_SCANS = 5  # Re-arm only after plate disappears for several OCR scans

def clean_text(text: str) -> str:
    text = text.upper().replace(" ", "")
    return re.sub(r"[^ก-ฮ0-9A-Z-]", "", text)

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

def post_detection_to_backend(plate: str, vehicle_type: str, helmet_detected: bool, zone: str = DEFAULT_ZONE):
    payload = {
        "license_plate": plate,
        "vehicle_type": vehicle_type,
        "helmet_detected": helmet_detected if vehicle_type == "motorcycle" else None,
        "gate_type": GATE_TYPE,
        "zone": zone
    }
    try:
        res = requests.post(API_URL, json=payload, timeout=3.0)
        if res.status_code in [200, 201]:
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
        for result in helmet_results:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = helmet_model.names[cls]

                if label in ["with_helmet", "no_helmet"]:
                    has_helmet = (label == "with_helmet")
                    recent_helmets.append(has_helmet)
                    recent_helmets = recent_helmets[-10:]

                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    box_color = (0, 255, 0) if has_helmet else (0, 0, 255)
                    box_text = f"Helmet: {'YES' if has_helmet else 'NO'} ({conf:.2f})"

                    cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                    cv2.putText(frame, box_text, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)

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

            # Submit once per vehicle appearance.
            # The same plate is not allowed again until it leaves the camera view.
            if stable_plate != last_submitted_plate and recent_plates.count(stable_plate) >= 2:
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

                    post_detection_to_backend(
                        plate=stable_plate,
                        vehicle_type=v_type,
                        helmet_detected=stable_helmet_state if is_motorcycle else None,
                        zone=zone_target
                    )

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
