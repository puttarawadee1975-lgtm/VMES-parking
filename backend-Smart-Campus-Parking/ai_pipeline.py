import os
import sys
import time
import re
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

# Video Capture (Camera 1 or 0 or CLI arg)
if len(sys.argv) > 1:
    cam_index = int(sys.argv[1])
else:
    cam_index = int(os.getenv("VIDEO_SOURCE", "1"))

print(f"[AI PIPELINE] Opening video source camera index: {cam_index}")
cap = cv2.VideoCapture(cam_index)

if not cap.isOpened() and cam_index != 0:
    print(f"[AI PIPELINE WARNING] Camera index {cam_index} failed. Falling back to camera index 0...")
    cam_index = 0
    cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print(f"[AI PIPELINE ERROR] Cannot open video source: {cam_index}", file=sys.stderr)
    print("Please make sure a webcam is connected or specify a video file/stream.")

# Thai Font for display
try:
    thai_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Thonburi.ttc", 30)
except Exception:
    thai_font = ImageFont.load_default()

# Stability Buffers
recent_plates = []
recent_helmets = []
last_submitted_plate = None
last_submitted_time = 0
COOLDOWN_SECONDS = 8.0  # Prevent spamming API for same vehicle

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
        print(f"[API NETWORK ERROR] Could not send to {API_URL}: {e}")

print("\n" + "="*60)
print(f"Smart Campus Parking AI Pipeline Running...")
print(f"Target API: {API_URL}")
print(f"Gate: {GATE_TYPE} | Zone: {DEFAULT_ZONE}")
print("Press 'q' in the video window to stop.")
print("="*60 + "\n")

frame_count = 0
OCR_INTERVAL = 8  # Run OCR every 8 frames for smooth FPS

current_display_plate = "Scanning..."
current_display_helmet = "Scanning..."

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    detected_helmet_status = None

    # ---------- 1. YOLO Helmet Detection ----------
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

    # ---------- 2. Plate OCR Detection ----------
    if frame_count % OCR_INTERVAL == 0:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        ocr_results = reader.readtext(gray)

        cleaned_tokens = []
        for bbox, text, conf in ocr_results:
            if conf > 0.35:
                cleaned = clean_text(text)
                if cleaned:
                    cleaned_tokens.append(cleaned)

        plate = extract_thai_plate(cleaned_tokens)
        if plate:
            recent_plates.append(plate)
            recent_plates = recent_plates[-8:]

            stable_plate = Counter(recent_plates).most_common(1)[0][0]
            current_display_plate = stable_plate

            # Check if this plate should trigger an API POST
            now = time.time()
            if (stable_plate != last_submitted_plate or (now - last_submitted_time) > COOLDOWN_SECONDS) and recent_plates.count(stable_plate) >= 2:
                # Infer vehicle type based on helmet detection or plate structure
                # Motorcycle: Helmet box detected or specific format
                is_motorcycle = (stable_helmet_state is not None)
                v_type = "motorcycle" if is_motorcycle else "car"
                zone_target = "Zone C (Motorcycle Only)" if is_motorcycle else DEFAULT_ZONE

                post_detection_to_backend(
                    plate=stable_plate,
                    vehicle_type=v_type,
                    helmet_detected=stable_helmet_state if is_motorcycle else None,
                    zone=zone_target
                )

                last_submitted_plate = stable_plate
                last_submitted_time = now

    # ---------- 3. Render HUD Banner ----------
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(frame_rgb)
    draw = ImageDraw.Draw(pil_img)

    # Top overlay bar
    draw.rectangle([(10, 10), (450, 95)], fill=(20, 20, 20, 200), outline=(0, 200, 255), width=2)
    draw.text((20, 15), f"Plate: {current_display_plate}", font=thai_font, fill=(255, 255, 0))
    draw.text((20, 55), f"Helmet: {current_display_helmet}", font=thai_font, fill=(0, 255, 0) if "YES" in current_display_helmet else (255, 80, 80))

    frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    cv2.imshow("Smart Campus AI Detection Pipeline (M1 Accelerated)", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
