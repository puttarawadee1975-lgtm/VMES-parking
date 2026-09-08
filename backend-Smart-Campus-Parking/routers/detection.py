from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from database import detection_logs_collection, users_collection, parking_status_collection
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
    
    if users_collection is not None:
        user_doc = users_collection.find_one({"vehicles.plate": payload.license_plate})
        if user_doc:
            matched_user = user_doc
            matched_user_name = f"{user_doc.get('name')} ({user_doc.get('email')})"
            
            # Deduct driving score if violation occurred
            if is_violation:
                current_score = user_doc.get("driving_score", 100)
                new_score = max(0, current_score - 10)
                users_collection.update_one(
                    {"_id": user_doc["_id"]},
                    {"$set": {"driving_score": new_score}}
                )

    # Insert into detection_logs collection
    log_doc = {
        "license_plate": payload.license_plate,
        "vehicle_type": vehicle_type,
        "helmet_detected": helmet_detected,
        "violation": is_violation,
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

    return log_response

IN_MEMORY_DETECTIONS = []

@router.get("", response_model=List[DetectionLogResponse])
async def get_all_detections():
    """
    Get recent AI detection logs for Admin Web Inspection Feed.
    """
    if detection_logs_collection is not None:
        docs = list(detection_logs_collection.find().sort("timestamp", -1).limit(50))
        if docs:
            result = []
            for doc in docs:
                result.append(DetectionLogResponse(
                    id=str(doc.get("_id", "id")),
                    license_plate=doc.get("license_plate", ""),
                    vehicle_type=doc.get("vehicle_type", "motorcycle"),
                    helmet_detected=doc.get("helmet_detected"),
                    violation=doc.get("violation", False),
                    gate_type=doc.get("gate_type", "ENTRY"),
                    zone=doc.get("zone", "Zone A"),
                    timestamp=doc.get("timestamp", datetime.now(timezone.utc)),
                    matched_user=doc.get("matched_user") or doc.get("matched_email") or "Guest / Unregistered"
                ))
            return result

    return IN_MEMORY_DETECTIONS

