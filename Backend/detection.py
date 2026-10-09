import re
import os
import base64
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from starlette.concurrency import run_in_threadpool
from storage import SnapshotStorageError, save_base64_snapshot, resolve_snapshot_url
from database import (
    detection_logs_collection,
    users_collection,
    parking_status_collection,
    parking_sessions_collection,
    registered_vehicles_collection,
    saved_spots_collection,
)
from store import update_in_memory_parking_status

from schemas import DetectionLogCreate, DetectionLogResponse
from parking_sessions import normalize_plate as normalize_session_plate
from parking_session_store import apply_session_transition
from database import get_mongo_client

router = APIRouter(prefix="/detections", tags=["AI Detections"])

async def snapshot_url(reference):
    try:
        return await run_in_threadpool(resolve_snapshot_url, reference)
    except SnapshotStorageError:
        raise HTTPException(status_code=503, detail="Snapshot delivery unavailable") from None

def ensure_utc(value) -> datetime:
    """Treat timezone-naive MongoDB datetimes or ISO strings as UTC for API serialization."""
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except Exception:
            value = datetime.now(timezone.utc)
    elif not isinstance(value, datetime):
        value = datetime.now(timezone.utc)

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

@router.post("", response_model=DetectionLogResponse, status_code=status.HTTP_201_CREATED)
async def ingest_detection_event(payload: DetectionLogCreate):
    """
    Ingest real-time detection event from YOLO11 / OCR camera script:
    1. Evaluates Car vs Motorcycle helmet rule:
       - Car: helmet_detected = None, violation = False
       - Motorcycle: helmet_detected = bool. If False -> violation = True, driving_score deducted
    2. Handles Registered vs Guest users gracefully
    3. Updates parking slot counts automatically (ENTRY vs EXIT)
    """
    now = payload.timestamp or datetime.now(timezone.utc)
    vehicle_type = payload.vehicle_type.lower()

    # Automatic Camera Mapping Rule:
    # Camera 01 / Cam 1 -> ENTRY Gate
    # Camera 02 / Cam 2 -> EXIT Gate
    camera_id = (payload.camera_id or "").strip()
    raw_gate = (payload.gate_type or "").strip().upper()

    if camera_id in ["01", "1"] or "01" in raw_gate or "CAM1" in raw_gate or "GATE 1" in raw_gate:
        resolved_gate_type = "ENTRY"
        gate_name = "VMES Entry Gate (Cam 01)"
        camera_id = "01"
    elif camera_id in ["02", "2"] or "02" in raw_gate or "CAM2" in raw_gate or "GATE 2" in raw_gate:
        resolved_gate_type = "EXIT"
        gate_name = "VMES Exit Gate (Cam 02)"
        camera_id = "02"
    else:
        resolved_gate_type = raw_gate if raw_gate in ["ENTRY", "EXIT"] else "ENTRY"
        camera_id = "01" if resolved_gate_type == "ENTRY" else "02"
        gate_name = f"VMES {resolved_gate_type.capitalize()} Gate (Cam {camera_id})"

    # Apply Business Logic for Helmet & Violations

    if vehicle_type == "car":
        helmet_detected = None
        is_violation = False
    else:  # motorcycle
        helmet_detected = payload.helmet_detected if payload.helmet_detected is not None else False
        is_violation = not helmet_detected  # No helmet = Violation

    # Finish snapshot storage/delivery preparation before score or occupancy mutations.
    raw_b64 = payload.snapshot_base64 if payload.snapshot_base64 is not None else (payload.image_url if payload.image_url and payload.image_url.startswith("data:") else None)
    final_img_url = payload.image_url if payload.image_url and not payload.image_url.startswith("data:") else None
    if raw_b64 is not None:
        try:
            final_img_url = await run_in_threadpool(save_base64_snapshot, raw_b64)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid snapshot image") from None
        except SnapshotStorageError:
            raise HTTPException(status_code=503, detail="Snapshot storage unavailable") from None
    resolved_img_url = await snapshot_url(final_img_url)
    response_b64 = None if final_img_url and final_img_url.startswith("s3://") else raw_b64

    # Look up if vehicle belongs to a registered user
    matched_user = None
    matched_user_name = "Guest / Unregistered"

    def normalize_plate(plate: str) -> str:
        """Normalize plate text for matching OCR output with stored plates."""
        normalized = (plate or "").strip()

        # Some stored registrations include the province after the plate.
        if normalized.endswith(" กรุงเทพมหานคร"):
            normalized = normalized.removesuffix(" กรุงเทพมหานคร")

        return normalized.replace("-", "").replace(" ", "").upper()

    detected_plate = normalize_plate(payload.license_plate)
    user_doc = None
    registered_vehicle = None

    if users_collection is not None:
        for candidate in users_collection.find({}):
            # Support legacy top-level license_plate field
            legacy_plate = candidate.get("license_plate")
            if legacy_plate and normalize_plate(legacy_plate) == detected_plate:
                user_doc = candidate
                break

            # Support newer embedded vehicles array
            for vehicle in candidate.get("vehicles", []):
                stored_plate = vehicle.get("plate")
                if stored_plate and normalize_plate(stored_plate) == detected_plate:
                    user_doc = candidate
                    break

            if user_doc:
                break

    # Support the group's registered_vehicles collection
    if user_doc is None and registered_vehicles_collection is not None:
        for vehicle in registered_vehicles_collection.find(
            {},
            {"plate": 1, "user_email": 1}
        ):
            stored_plate = vehicle.get("plate")
            if stored_plate and normalize_plate(stored_plate) == detected_plate:
                registered_vehicle = vehicle

                user_email = vehicle.get("user_email")
                if user_email and users_collection is not None:
                    user_doc = users_collection.find_one({"email": user_email})
                break

    penalty_applied = False
    role_str = "Guest"
    user_id_str = "GUEST"

    if user_doc:
        matched_user = user_doc
        matched_user_name = f"{user_doc.get('name')} ({user_doc.get('email')})"
        role_str = (user_doc.get("role") or "Student").capitalize()
        user_id_str = user_doc.get("user_id") or user_doc.get("userId") or (user_doc.get("email", "").split("@")[0].upper() if "@" in user_doc.get("email", "") else "USER")

        # Check if Master Enforcement system is ACTIVE
        from database import system_settings_collection
        enforcement_enabled = True
        if system_settings_collection is not None:
            setting = system_settings_collection.find_one({"key": "enforcement_system"})
            if setting and "active" in setting:
                enforcement_enabled = setting["active"]

        # Helmet detection is an EXCEPTION: Always active 24/7 (always deduct points & notify even if Parking Access Mode is OFF)
        if is_violation:
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

            already_deducted_today = False
            if detection_logs_collection is not None:
                existing_log = detection_logs_collection.find_one({
                    "$or": [
                        {"license_plate": payload.license_plate},
                        {"matched_email": user_doc.get("email")}
                    ],
                    "violation": True,
                    "timestamp": {"$gte": today_start, "$lte": today_end}
                })

                if existing_log:
                    already_deducted_today = True

            if not already_deducted_today:
                current_score = user_doc.get("driving_score", 100)
                new_score = max(0, current_score - 10)
                users_collection.update_one(
                    {"_id": user_doc["_id"]},
                    {"$set": {"driving_score": new_score}}
                )
                penalty_applied = True

    elif registered_vehicle:
        matched_user_name = registered_vehicle.get("user_email") or "Registered Vehicle"
        role_str = (registered_vehicle.get("role") or "Student").capitalize()
        user_id_str = registered_vehicle.get("user_id") or registered_vehicle.get("userId") or (registered_vehicle.get("user_email", "").split("@")[0].upper() if "@" in registered_vehicle.get("user_email", "") else "STUDENT")
    else:
        matched_user_name = "Guest Driver"
        role_str = "Guest"
        user_id_str = "GUEST"

    # Insert into detection_logs collection
    log_doc = {
        "license_plate": payload.license_plate,
        "vehicle_type": vehicle_type,
        "helmet_detected": helmet_detected,
        "violation": is_violation,
        "penalty_applied": penalty_applied,
        "gate_type": resolved_gate_type,
        "camera_id": camera_id,
        "gate_name": gate_name,
        "zone": payload.zone or "-",
        "term": "2026-1",
        "timestamp": now,
        "matched_email": matched_user.get("email") if matched_user else None,
        "matched_user": matched_user_name,
        "role": role_str,
        "user_id": user_id_str,
        "userId": user_id_str,
        # Event snapshot captured by ai_pipeline.py or web camera
        "image_url": final_img_url,
    }

    if response_b64 is not None:
        log_doc["snapshot_base64"] = response_b64

    inserted_id = "mock_id"
    if detection_logs_collection is not None:
        res = detection_logs_collection.insert_one(log_doc)
        inserted_id = str(res.inserted_id)

    log_response = DetectionLogResponse(
        id=inserted_id,
        license_plate=payload.license_plate,
        vehicle_type=vehicle_type,
        helmet_detected=helmet_detected,
        violation=is_violation,
        penalty_applied=penalty_applied,
        gate_type=resolved_gate_type,
        camera_id=camera_id,
        zone=payload.zone or "-",
        timestamp=now,
        matched_user=matched_user_name,
        image_url=resolved_img_url,
        snapshot_base64=response_b64 or None,
    )

    cached_response = log_response.model_dump()
    cached_response["image_url"] = final_img_url
    IN_MEMORY_DETECTIONS.insert(0, cached_response)
    if len(IN_MEMORY_DETECTIONS) > 100:
        IN_MEMORY_DETECTIONS.pop()

    # Only accepted parking-session transitions may change car occupancy.
    session_action = None
    session_zone = None

    if vehicle_type == "car":
        z_req = (payload.zone or "").upper()
        search_zone = "Zone C" if "ZONE C" in z_req or "C-" in z_req else "Zone A"

        plate_key = normalize_session_plate(payload.license_plate)

        if plate_key:
            try:
                session_result = apply_session_transition(
                    client=get_mongo_client(),
                    sessions_collection=parking_sessions_collection,
                    occupancy_collection=parking_status_collection,
                    plate=payload.license_plate,
                    zone=search_zone,
                    gate_type=resolved_gate_type,
                )
            except Exception:
                if detection_logs_collection is not None and inserted_id != "mock_id":
                    try:
                        detection_logs_collection.update_one(
                            {"_id": res.inserted_id},
                            {"$set": {"parking_session_action": "ERROR"}},
                        )
                    except Exception:
                        pass
                cached_response["parking_session_action"] = "ERROR"
                raise
            session_action = session_result["action"]
            session_zone = session_result["zone"]

            if session_action in {"ENTER", "EXIT"}:
                try:
                    update_in_memory_parking_status(
                        session_zone,
                        "ENTRY" if session_action == "ENTER" else "EXIT",
                    )
                except Exception as e:
                    print(f"[Parking Status Cache Update Error] {e}")

    # Automatically mark active saved spot as Exited on CCTV EXIT gate scan
    try:
        if session_action == "EXIT" and saved_spots_collection is not None:
            clean_lp = (payload.license_plate or "").replace("-", "").replace(" ", "").upper()
            if matched_user and matched_user.get("email"):
                saved_spots_collection.update_many(
                    {"user_email": matched_user["email"], "status": "Active Parked"},
                    {"$set": {"status": "Exited", "exit_timestamp": now, "exitTime": now.strftime("%I:%M %p")}}
                )
            elif clean_lp:
                for sp in saved_spots_collection.find({"status": "Active Parked"}):
                    sp_p = (sp.get("plate") or "").replace("-", "").replace(" ", "").upper()
                    if sp_p and sp_p == clean_lp:
                        saved_spots_collection.update_one(
                            {"_id": sp["_id"]},
                            {"$set": {"status": "Exited", "exit_timestamp": now, "exitTime": now.strftime("%I:%M %p")}}
                        )

    except Exception as e:
        print(f"[Saved Spot Exit Sync Error] {e}")

    # Persist the parking-session outcome for detection history.
    log_response.parking_session_action = session_action
    if detection_logs_collection is not None and inserted_id != "mock_id":
        try:
            detection_logs_collection.update_one(
                {"_id": res.inserted_id},
                {"$set": {"parking_session_action": session_action}},
            )
        except Exception as e:
            print(f"[Detection Session Status Persistence Error] {e}")

    # Update this detection's cached response, not another camera's record.
    cached_response["parking_session_action"] = session_action

    # Automatic notification dispatch is unavailable: routers.notifications is not implemented.

    return log_response

IN_MEMORY_DETECTIONS = []

@router.get("", response_model=List[DetectionLogResponse])
async def get_all_detections(days: int = 30):
    """
    Get AI detection logs within the 30-day retention window for App & Admin Web.
    Optimized with MongoDB projection to prevent heavy base64 payload lag.
    """
    from datetime import timedelta
    if detection_logs_collection is not None:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            projection = {"snapshot_base64": 0}
            docs = list(detection_logs_collection.find({"timestamp": {"$gte": cutoff}}, projection).sort("timestamp", -1).limit(200))
            if not docs:
                docs = list(detection_logs_collection.find({}, projection).sort("timestamp", -1).limit(200))

            if docs:
                result = []
                for doc in docs:
                    result.append(DetectionLogResponse(
                        id=str(doc.get("_id", "id")),
                        license_plate=doc.get("license_plate", ""),
                        vehicle_type=doc.get("vehicle_type", "motorcycle"),
                        helmet_detected=doc.get("helmet_detected"),
                        violation=doc.get("violation", False),
                        penalty_applied=doc.get("penalty_applied"),
                        parking_session_action=doc.get("parking_session_action"),
                        gate_type=doc.get("gate_type", "ENTRY"),
                        camera_id=doc.get("camera_id"),
                        zone=doc.get("zone", "-"),
                        timestamp=ensure_utc(doc.get("timestamp", datetime.now(timezone.utc))),
                        matched_user=doc.get("matched_user") or doc.get("matched_email") or "Guest / Unregistered",
                        image_url=await snapshot_url(doc.get("image_url") or doc.get("snapshot_url") or doc.get("photo")),
                        snapshot_base64=None,
                    ))
                return result
        except HTTPException:
            raise
        except Exception:
            print("[DETECTION FETCH WARNING] Detection database read failed.")

    return [dict(item, image_url=await snapshot_url(item.get("image_url"))) for item in IN_MEMORY_DETECTIONS]



@router.get("/{detection_id}/snapshot")
async def get_detection_snapshot(detection_id: str):
    """Return snapshot data for one detection only."""
    if detection_logs_collection is None:
        raise HTTPException(status_code=503, detail="Detection database unavailable")

    if not ObjectId.is_valid(detection_id):
        raise HTTPException(status_code=400, detail="Invalid detection ID")

    doc = detection_logs_collection.find_one(
        {"_id": ObjectId(detection_id)},
        {"snapshot_base64": 1, "image_url": 1, "snapshot_url": 1, "photo": 1, "_id": 0},
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Detection not found")

    b64 = doc.get("snapshot_base64")
    url = doc.get("image_url") or doc.get("snapshot_url") or doc.get("photo")

    # If snapshot_base64 exists and is not formatted with data URI scheme
    if b64 and not b64.startswith("data:"):
        b64 = f"data:image/jpeg;base64,{b64}"

    # Legacy Base64 stays readable, but GET never restores files or changes records.
    return {
        "image_url": b64 or await snapshot_url(url),
        "snapshot_base64": b64 or None,
    }


def clean_text(text: str) -> str:
    text = text.upper()
    text = text.replace(" ", "")
    text = re.sub(r"[^ก-ฮ0-9A-Z-]", "", text)
    return text

def extract_plate(texts: list) -> str:
    clean_texts = [text.replace(" ", "").replace("-", "").strip() for text in texts if text]

    # 1. Single token full match e.g. "3กฮ5678", "1กข1234", "กข5678"
    for text in clean_texts:
        m = re.fullmatch(r"([0-9]{1,2}[ก-ฮ]{1,3})([0-9]{1,4})", text)
        if m:
            return f"{m.group(1)} {m.group(2)}"

        m2 = re.fullmatch(r"([ก-ฮ]{1,3})([0-9]{1,4})", text)
        if m2:
            return f"{m2.group(1)} {m2.group(2)}"

    # 2. Split line tokens e.g. ['3กฮ', '5678'] or ['1กข', '1234'] or ['กข', '5678']
    for i in range(len(clean_texts)):
        m_head = re.fullmatch(r"([0-9]{1,2}[ก-ฮ]{1,3}|[ก-ฮ]{1,3})", clean_texts[i])
        if m_head:
            for j in range(i + 1, len(clean_texts)):
                m_num = re.fullmatch(r"[0-9]{1,4}", clean_texts[j])
                if m_num:
                    return f"{clean_texts[i]} {clean_texts[j]}"

    # 3. Alphanumeric / International e.g. "1B961" or ["1B9", "61"]
    for text in clean_texts:
        m = re.fullmatch(r"([0-9]{1,2}[A-Z]{1,3})([0-9]{1,4})", text)
        if m:
            return f"{m.group(1)} {m.group(2)}"

    for i in range(len(clean_texts) - 1):
        cand = clean_texts[i] + clean_texts[i + 1]
        m = re.fullmatch(r"([0-9]{1,2}[A-Z]{1,3})([0-9]{1,4})", cand)
        if m:
            return f"{clean_texts[i]} {clean_texts[i+1]}"

    # 4. Private truck format: 82-4728
    for text in clean_texts:
        if re.fullmatch(r"[0-9]{6}", text):
            return f"{text[:2]}-{text[2:]}"

    return ""

THAI_PROVINCES = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี",
    "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
    "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
    "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
    "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร",
    "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
    "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน",
    "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร",
    "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์",
    "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
]

PROVINCE_SYNONYMS = {
    "กทม": "กรุงเทพมหานคร",
    "กรุงเทพ": "กรุงเทพมหานคร",
    "กรุงเทพมหานคร": "กรุงเทพมหานคร",
    "อยุธยา": "พระนครศรีอยุธยา",
    "โคราช": "นครราชสีมา",
    "แปดริ้ว": "ฉะเชิงเทรา",
    "เมืองชล": "ชลบุรี",
    "ปากน้ำ": "สมุทรปราการ",
    "มหาชัย": "สมุทรสาคร",
}

def extract_province(texts: list) -> str:
    """
    Extract province from OCR text lines using strict Thai province matching.
    Avoid matching 1-2 character plate series tokens (e.g. 'ก', 'ข') as substring of provinces!
    """
    if not texts:
        return "กรุงเทพมหานคร"

    # Pass 1: Exact synonym or exact province match in raw text tokens
    for text in texts:
        clean = text.replace(" ", "").replace("-", "").strip()
        if not clean:
            continue

        # Check against known synonyms/abbreviations
        for syn, official_prov in PROVINCE_SYNONYMS.items():
            if syn in clean:
                return official_prov

        # Check if an official province name is explicitly contained inside the OCR text
        for prov in THAI_PROVINCES:
            if prov in clean:
                return prov

    # Pass 2: Fuzzy matching or substring matching ONLY for tokens with length >= 3
    import difflib
    for text in texts:
        clean = text.replace(" ", "").replace("-", "").strip()
        if len(clean) >= 3:
            for prov in THAI_PROVINCES:
                if clean in prov:
                    return prov

            matches = difflib.get_close_matches(clean, THAI_PROVINCES, n=1, cutoff=0.7)
            if matches:
                return matches[0]

    return "กรุงเทพมหานคร"

_CACHED_EASYOCR_READER = None

def get_ocr_reader():
    global _CACHED_EASYOCR_READER
    if _CACHED_EASYOCR_READER is None:
        import easyocr
        import torch
        use_gpu = torch.cuda.is_available()
        print(f"[API OCR] Initializing global warm EasyOCR model (gpu={use_gpu})...")
        _CACHED_EASYOCR_READER = easyocr.Reader(['th', 'en'], gpu=use_gpu)
    return _CACHED_EASYOCR_READER

class OCRScanRequest(BaseModel):
    image_base64: str
    vehicle_type: Optional[str] = "car"

@router.post("/ocr-scan")
async def scan_plate_from_image(payload: OCRScanRequest):
    """
    Real-time AI OCR endpoint for Mobile Camera Scanner:
    1. Resizes high-res camera photos to optimal width (1200px) for CRAFT detector.
    2. Multi-pass OCR (Direct BGR + Bilateral Filter + CLAHE Contrast).
    3. Cleans text with clean_text() and parses plate pattern with extract_plate().
    """
    import base64
    import urllib.request
    import urllib.parse
    import json

    img_data = payload.image_base64
    if "," in img_data:
        img_data = img_data.split(",")[1]

    detected_plate = ""
    detected_province = "กรุงเทพมหานคร"
    raw_ocr_tokens = []

    try:
        import numpy as np
        import cv2

        image_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is not None:
            h, w = img.shape[:2]

            # Scale high-res camera photos down to optimal CRAFT detector width (1200px)
            target_w = 1200
            if w > target_w:
                scale = target_w / float(w)
                target_h = int(h * scale)
                img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)
                h, w = img.shape[:2]

            # Crop ROI frame box generously (center 90% width, 70% height)
            crop_w = int(w * 0.90)
            crop_h = int(h * 0.70)
            start_x = max(0, (w - crop_w) // 2)
            start_y = max(0, (h - crop_h) // 2)
            roi_img = img[start_y:start_y + crop_h, start_x:start_x + crop_w]

            gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
            pass1_img = cv2.bilateralFilter(gray, 9, 75, 75)
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            pass2_img = clahe.apply(gray)

            try:
                reader = get_ocr_reader()

                # Pass 1: Direct BGR ROI Image Scan
                res0 = reader.readtext(roi_img, detail=1)
                for bbox, text, confidence in res0:
                    if confidence > 0.20:
                        cleaned = clean_text(text)
                        if cleaned:
                            raw_ocr_tokens.append(cleaned)

                # Pass 2: Grayscale Bilateral Filter
                if not raw_ocr_tokens or not extract_plate(raw_ocr_tokens):
                    res1 = reader.readtext(pass1_img, detail=1)
                    for bbox, text, confidence in res1:
                        if confidence > 0.20:
                            cleaned = clean_text(text)
                            if cleaned:
                                raw_ocr_tokens.append(cleaned)

                # Pass 3: CLAHE Contrast Enhanced
                if not raw_ocr_tokens or not extract_plate(raw_ocr_tokens):
                    res2 = reader.readtext(pass2_img, detail=1)
                    for bbox, text, confidence in res2:
                        if confidence > 0.20:
                            cleaned = clean_text(text)
                            if cleaned:
                                raw_ocr_tokens.append(cleaned)

                # Strategy 2: Full Image Direct Scan if ROI crop yielded no plate pattern
                if not raw_ocr_tokens or not extract_plate(raw_ocr_tokens):
                    full_res = reader.readtext(img, detail=1)
                    for bbox, text, confidence in full_res:
                        if confidence > 0.20:
                            cleaned = clean_text(text)
                            if cleaned:
                                raw_ocr_tokens.append(cleaned)

            except Exception as ocr_ex:
                print(f"[OCR LOCAL NOTICE] {ocr_ex}")

    except Exception as e:
        print(f"[OCR CV2 ERROR] {e}")

    # Fallback Strategy 3: Cloud OCR Space API if local EasyOCR found no tokens
    if not raw_ocr_tokens and img_data:
        try:
            url = "https://api.ocr.space/parse/image"
            form_data = {
                'apikey': 'helloworld',
                'language': 'tha',
                'base64Image': f"data:image/jpeg;base64,{img_data}",
                'OCREngine': '2'
            }
            data = urllib.parse.urlencode(form_data).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})

            with urllib.request.urlopen(req, timeout=8) as response:
                res_text = response.read().decode('utf-8')
                res_json = json.loads(res_text)
                parsed_results = res_json.get("ParsedResults", [])
                for item in parsed_results:
                    text_lines = item.get("ParsedText", "").split("\n")
                    for line in text_lines:
                        cleaned = clean_text(line)
                        if cleaned:
                            raw_ocr_tokens.append(cleaned)
        except Exception as cloud_err:
            print(f"[OCR CLOUD ERROR] {cloud_err}")

    # Extract license plate & province using multi-pass rules
    if raw_ocr_tokens:
        detected_plate = extract_plate(raw_ocr_tokens)
        detected_province = extract_province(raw_ocr_tokens)

    # Registered Vehicle Lookup: If detected_plate is in DB, prioritize stored registered province
    if detected_plate:
        norm_p = detected_plate.replace("-", "").replace(" ", "").upper()
        reg_prov = None

        if registered_vehicles_collection is not None:
            for veh in registered_vehicles_collection.find(
                {},
                {"plate": 1, "province": 1}
            ):
                sp = (veh.get("plate") or "").replace("-", "").replace(" ", "").upper()
                if sp and sp == norm_p and veh.get("province"):
                    reg_prov = veh.get("province")
                    break

        if not reg_prov and users_collection is not None:
            for usr in users_collection.find({}):
                for veh in usr.get("vehicles", []):
                    sp = (veh.get("plate") or "").replace("-", "").replace(" ", "").upper()
                    if sp and sp == norm_p and veh.get("province"):
                        reg_prov = veh.get("province")
                        break
                if reg_prov:
                    break

        if reg_prov:
            detected_province = reg_prov

    return {
        "plate": detected_plate,
        "province": detected_province
    }
