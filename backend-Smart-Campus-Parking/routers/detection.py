from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from database import detection_logs_collection, users_collection, parking_status_collection, registered_vehicles_collection
from schemas import DetectionLogCreate, DetectionLogResponse

router = APIRouter(prefix="/detections", tags=["AI Detections"])

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

    # Apply Business Logic for Helmet & Violations
    if vehicle_type == "car":
        helmet_detected = None
        is_violation = False
    else:  # motorcycle
        helmet_detected = payload.helmet_detected if payload.helmet_detected is not None else False
        is_violation = not helmet_detected  # No helmet = Violation

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
        for vehicle in registered_vehicles_collection.find({}):
            stored_plate = vehicle.get("plate")
            if stored_plate and normalize_plate(stored_plate) == detected_plate:
                registered_vehicle = vehicle

                user_email = vehicle.get("user_email")
                if user_email and users_collection is not None:
                    user_doc = users_collection.find_one({"email": user_email})
                break

    penalty_applied = False

    if user_doc:
        matched_user = user_doc
        matched_user_name = f"{user_doc.get('name')} ({user_doc.get('email')})"

        # Check if Master Enforcement system is ACTIVE
        from database import system_settings_collection
        enforcement_enabled = True
        if system_settings_collection is not None:
            setting = system_settings_collection.find_one({"key": "enforcement_system"})
            if setting and "active" in setting:
                enforcement_enabled = setting["active"]

        # Deduct driving score at most once per day IF enforcement is enabled
        if is_violation and enforcement_enabled:
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
   
 # Insert into detection_logs collection
    log_doc = {
        "license_plate": payload.license_plate,
        "vehicle_type": vehicle_type,
        "helmet_detected": helmet_detected,
        "violation": is_violation,
        "penalty_applied": penalty_applied,
        "gate_type": payload.gate_type,
        "zone": payload.zone or "Zone A",
        "timestamp": now,
        "matched_email": matched_user.get("email") if matched_user else None
    }

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
        gate_type=payload.gate_type,
        zone=payload.zone,
        timestamp=now,
        matched_user=matched_user_name
    )

    IN_MEMORY_DETECTIONS.insert(0, log_response.model_dump())
    if len(IN_MEMORY_DETECTIONS) > 100:
        IN_MEMORY_DETECTIONS.pop()

    # Automatically update parking slots in real-time (ONLY FOR CARS)
    if parking_status_collection is not None and vehicle_type == "car":
        zone_name = payload.zone or "VMES Parking (Car Only)"
        zone_doc = parking_status_collection.find_one({"zone": zone_name})
        if zone_doc:
            occupied = zone_doc.get("occupied_slots", 0)
            total = zone_doc.get("total_slots", 18)
            if payload.gate_type == "ENTRY":
                occupied = min(total, occupied + 1)
            elif payload.gate_type == "EXIT":
                occupied = max(0, occupied - 1)

            parking_status_collection.update_one(
                {"zone": zone_name},
                {
                    "$set": {
                        "occupied_slots": occupied,
                        "available_slots": max(0, total - occupied),
                        "last_updated": now
                    }
                }
            )

    # Trigger automatic notification creation on Vehicle ENTRY (Student Cars ONLY for VMES Parking Limit)
    if payload.gate_type == "ENTRY" and matched_user and matched_user.get("email"):
        try:
            user_role = (matched_user.get("role") or "student").lower()
            if user_role == "student" and vehicle_type == "car":
                from routers.notifications import check_and_create_vmes_parking_notification
                check_and_create_vmes_parking_notification(matched_user["email"], payload.zone or "VMES Building")

            if is_violation:
                from routers.notifications import trigger_helmet_violation_notification
                trigger_helmet_violation_notification(matched_user["email"], payload.license_plate, payload.zone or "VMES Entry Gate")
        except Exception as noti_err:
            print(f"[DETECTION NOTI ERROR] {noti_err}")

    return log_response

IN_MEMORY_DETECTIONS = []

@router.get("", response_model=List[DetectionLogResponse])
async def get_all_detections(days: int = 30):
    """
    Get AI detection logs within the 30-day retention window for App & Admin Web.
    """
    from datetime import timedelta
    if detection_logs_collection is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        docs = list(detection_logs_collection.find({"timestamp": {"$gte": cutoff}}).sort("timestamp", -1).limit(200))
        if not docs:
            # Fallback to recent logs if database has less data
            docs = list(detection_logs_collection.find().sort("timestamp", -1).limit(200))

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
                    gate_type=doc.get("gate_type", "ENTRY"),
                    zone=doc.get("zone", "Zone A"),
                    timestamp=doc.get("timestamp", datetime.now(timezone.utc)),
                    matched_user=doc.get("matched_user") or doc.get("matched_email") or "Guest / Unregistered"
                ))
            return result

    return IN_MEMORY_DETECTIONS

