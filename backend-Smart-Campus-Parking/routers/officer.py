from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from database import detection_logs_collection, users_collection
from schemas import DetectionLogResponse
from auth import require_roles

router = APIRouter(prefix="/officer", tags=["Officer Operations"])

@router.get("/detections", response_model=List[DetectionLogResponse])
async def get_live_detections(
    limit: int = Query(50, ge=1, le=200),
    violation_only: Optional[bool] = Query(None),
    current_user: dict = Depends(require_roles(["officer", "office"]))
):
    """
    Officer & Office Role only: View real-time AI detection logs (Helmets, Plates, Violations).
    """
    if detection_logs_collection is None:
        return []

    filter_query = {}
    if violation_only is not None:
        filter_query["violation"] = violation_only

    cursor = detection_logs_collection.find(filter_query, {"image_url": 0, "snapshot_base64": 0}).sort("timestamp", -1).limit(limit)
    results = []

    for doc in cursor:
        doc_id = str(doc.get("_id"))
        plate = doc.get("license_plate", "")
        
        # Match with registered user if available
        matched_user_name = "Guest / Unregistered"
        if users_collection is not None and plate:
            matched_user = users_collection.find_one({"vehicles.plate": plate})
            if matched_user:
                matched_user_name = f"{matched_user.get('name')} ({matched_user.get('email')})"

        results.append(
            DetectionLogResponse(
                id=doc_id,
                license_plate=plate,
                vehicle_type=doc.get("vehicle_type", "car"),
                helmet_detected=doc.get("helmet_detected"),
                violation=doc.get("violation", False),
                gate_type=doc.get("gate_type", "ENTRY"),
                zone=doc.get("zone", "Zone A"),
                timestamp=doc.get("timestamp"),
                matched_user=matched_user_name
            )
        )

    return results
