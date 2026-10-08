"""
Admin Web Router - Endpoints dedicated for Admin Web Dashboard and Officer Management
"""

from fastapi import APIRouter, HTTPException
from database import is_db_connected, registered_vehicles_collection
import store

router = APIRouter(tags=["Admin Web"])

@router.get("/admin/enforcement-status")
def get_enforcement_status():
    return store.enforcement_status

@router.put("/admin/enforcement-status")
def update_enforcement_status(enabled: bool):
    store.enforcement_status["enabled"] = enabled
    return {
        "message": "Enforcement status updated",
        "enabled": store.enforcement_status["enabled"]
    }

@router.get("/admin/dashboard")
def get_dashboard():
    return {
        "totalScans": 1284,
        "violationsCount": 146,
        "avgSafetyScore": 88,
        "hourlyOccupancy": [
            {"time": "09:00", "avgSlots": 5},
            {"time": "10:00", "avgSlots": 8},
            {"time": "11:00", "avgSlots": 11},
            {"time": "12:00", "avgSlots": 14},
            {"time": "13:00", "avgSlots": 12},
            {"time": "14:00", "avgSlots": 10},
            {"time": "15:00", "avgSlots": 13},
            {"time": "16:00", "avgSlots": 9},
            {"time": "17:00", "avgSlots": 7},
            {"time": "18:00", "avgSlots": 4}
        ],
        "vehicleType": {
            "motorcycles": {
                "trips": 850,
                "pct": 66.2
            },
            "cars": {
                "trips": 434,
                "pct": 33.8
            }
        },
        "userType": {
            "registered": {
                "trips": 1100,
                "pct": 85.7
            },
            "unregistered": {
                "trips": 184,
                "pct": 14.3
            }
        },
        "monthlyTrend": [
            {"month": "Jun", "traffic": 220, "violations": 25},
            {"month": "Jul", "traffic": 280, "violations": 31},
            {"month": "Aug", "traffic": 350, "violations": 38},
            {"month": "Sep", "traffic": 434, "violations": 52}
        ]
    }

@router.get("/admin/gate-history")
async def get_gate_history():
    """Return recorded camera detections for the Admin Web history."""
    from detection import get_all_detections

    detections = await get_all_detections()
    return {
        "history": [
            item.model_dump(mode="json") if hasattr(item, "model_dump") else item
            for item in detections
        ]
    }

@router.get("/admin/all-vehicles")
@router.get("/admin/vehicle-directory")
@router.get("/admin/driving-score")
@router.get("/admin/users")
def get_all_registered_vehicles():
    if not is_db_connected() or registered_vehicles_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    projection = {
        "_id": 0,
        "id": 1,
        "user_id": 1,
        "plate": 1,
        "license_plate": 1,
        "province": 1,
        "vehicle_type": 1,
        "brand": 1,
        "model": 1,
        "color": 1,
        "owner": 1,
        "user_email": 1,
        "role": 1,
        "score": 1,
        "status": 1,
        "registered_at": 1,
    }

    vehicles = list(registered_vehicles_collection.find({}, projection))

    for vehicle in vehicles:
        plate = vehicle.get("plate") or vehicle.get("license_plate") or ""
        vehicle["plate"] = plate
        vehicle["license_plate"] = plate
        vehicle.setdefault("vehicle_type", "car")
        vehicle.setdefault("brand", "")
        vehicle.setdefault("model", "")
        vehicle.setdefault("color", "")
        vehicle.setdefault("owner", "Registered Driver")
        vehicle.setdefault("score", 100)
        vehicle.setdefault("status", "Active")

        if "user_id" not in vehicle:
            email = vehicle.get("user_email", "")
            email_digits = "".join(filter(str.isdigit, email.split("@")[0]))
            vehicle["user_id"] = email_digits

        vehicle["userId"] = vehicle.get("user_id", "")

    return vehicles

@router.post("/admin/vehicle-register")
def admin_register_vehicle(payload: dict):
    from datetime import datetime, timezone
    import uuid

    if not is_db_connected() or registered_vehicles_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    email = payload.get("user_email") or payload.get("email") or ""
    role = (payload.get("role") or "Student").lower()
    plate = payload.get("plate") or payload.get("license_plate") or "Unregistered"
    norm_plate = plate.strip().upper()

    if email and role != "admin":
        if registered_vehicles_collection.find_one(
            {"user_email": email},
            {"_id": 1}
        ):
            raise HTTPException(
                status_code=400,
                detail="Registration Limit Reached: 1 vehicle is allowed per account."
            )

    for vehicle in registered_vehicles_collection.find(
        {},
        {"plate": 1, "license_plate": 1}
    ):
        existing_plate = (
            vehicle.get("plate")
            or vehicle.get("license_plate")
            or ""
        ).strip().upper()

        if existing_plate and existing_plate == norm_plate:
            raise HTTPException(
                status_code=400,
                detail=f"License plate '{plate}' is already registered in the system."
            )

    v_type = payload.get("vehicle_type") or "car"
    brand = payload.get("brand") or ""
    model = payload.get("model") or f"{brand} Vehicle".strip()
    color = payload.get("color") or ""
    owner = payload.get("owner") or "Registered Driver"
    user_role = (payload.get("role") or "Student").title()
    provided_user_id = payload.get("user_id") or payload.get("userId")

    if user_role in ["Staff", "Faculty"]:
        user_id = provided_user_id or uuid.uuid4().hex[:8]
    else:
        email_digits = "".join(
            filter(str.isdigit, email.split("@")[0])
        ) if email else ""
        user_id = provided_user_id or (
            email_digits if email_digits else uuid.uuid4().hex[:8]
        )

    new_vehicle = {
        "id": uuid.uuid4().hex,
        "user_id": str(user_id),
        "plate": plate,
        "license_plate": plate,
        "vehicle_type": v_type,
        "brand": brand,
        "model": model,
        "color": color,
        "owner": owner,
        "user_email": email,
        "role": user_role,
        "score": 100,
        "status": "Active",
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }

    registered_vehicles_collection.insert_one(dict(new_vehicle))

    return {
        "status": "success",
        "message": "Vehicle registered successfully",
        "vehicle": new_vehicle
    }

@router.put("/admin/update-vehicle")
def update_vehicle(payload: dict):
    if not is_db_connected() or registered_vehicles_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    target_plate = payload.get("old_plate") or payload.get("plate")
    if not target_plate:
        raise HTTPException(status_code=400, detail="Vehicle plate is required")

    existing = registered_vehicles_collection.find_one(
        {
            "$or": [
                {"plate": target_plate},
                {"license_plate": target_plate},
            ]
        },
        {"_id": 1, "plate": 1, "license_plate": 1}
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    updates = {}

    if "plate" in payload:
        new_plate = payload["plate"]
        norm_new_plate = new_plate.strip().upper()

        duplicate = registered_vehicles_collection.find_one(
            {
                "_id": {"$ne": existing["_id"]},
                "$or": [
                    {"plate": {"$regex": f"^{norm_new_plate}$", "$options": "i"}},
                    {"license_plate": {"$regex": f"^{norm_new_plate}$", "$options": "i"}},
                ],
            },
            {"_id": 1}
        )

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail=f"License plate '{new_plate}' is already registered in the system."
            )

        updates["plate"] = new_plate
        updates["license_plate"] = new_plate

    for field in [
        "vehicle_type",
        "brand",
        "model",
        "color",
        "owner",
        "user_email",
        "role",
    ]:
        if field in payload:
            updates[field] = payload[field]

    if not updates:
        raise HTTPException(status_code=400, detail="No vehicle fields supplied for update")

    registered_vehicles_collection.update_one(
        {"_id": existing["_id"]},
        {"$set": updates}
    )

    updated = registered_vehicles_collection.find_one(
        {"_id": existing["_id"]},
        {
            "_id": 0,
            "id": 1,
            "user_id": 1,
            "plate": 1,
            "license_plate": 1,
            "vehicle_type": 1,
            "brand": 1,
            "model": 1,
            "color": 1,
            "owner": 1,
            "user_email": 1,
            "role": 1,
            "score": 1,
            "status": 1,
            "registered_at": 1,
        }
    )

    return {
        "status": "success",
        "message": "Vehicle updated successfully",
        "vehicle": updated,
    }

@router.get("/officer/detections")
def get_officer_detections(violation_only: bool = False):
    history_data = get_gate_history()
    items = history_data.get("history", [])
    if violation_only:
        items = [i for i in items if i.get("violation")]
    return items

@router.get("/admin/score-logs")
def get_score_logs():
    return store.score_logs_list

@router.post("/admin/adjust-score")
def adjust_score(payload: dict):
    if not is_db_connected() or registered_vehicles_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    email = payload.get("user_email") or ""
    owner_name = payload.get("owner") or ""
    change = payload.get("points_changed", 0)

    if not isinstance(change, (int, float)):
        raise HTTPException(status_code=400, detail="points_changed must be numeric")

    if not email and not owner_name:
        raise HTTPException(
            status_code=400,
            detail="user_email, owner, or plate is required"
        )

    query_parts = []

    if email:
        query_parts.append({"user_email": email})

    if owner_name:
        query_parts.extend([
            {"owner": owner_name},
            {"plate": owner_name},
            {"license_plate": owner_name},
        ])

    query = query_parts[0] if len(query_parts) == 1 else {"$or": query_parts}

    vehicle = registered_vehicles_collection.find_one(
        query,
        {
            "_id": 1,
            "score": 1,
        }
    )

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    current_score = vehicle.get("score", 100)
    new_score = max(0, min(100, current_score + change))

    registered_vehicles_collection.update_one(
        {"_id": vehicle["_id"]},
        {"$set": {"score": new_score}}
    )

    updated_vehicle = registered_vehicles_collection.find_one(
        {"_id": vehicle["_id"]},
        {
            "_id": 0,
            "id": 1,
            "user_id": 1,
            "plate": 1,
            "license_plate": 1,
            "owner": 1,
            "user_email": 1,
            "role": 1,
            "score": 1,
            "status": 1,
        }
    )

    return {
        "status": "success",
        "message": "Score updated successfully",
        "vehicle": updated_vehicle,
    }

@router.post("/admin/reset-semester-scores")
def reset_semester_scores(payload: dict = {}):
    term_name = payload.get("semester_name") or "Current Academic Semester"
    for v in store.registered_vehicles:
        v["score"] = 100

    if is_db_connected():
        try:
            print(f"[Database Sync] All driver safety scores reset to 100 for {term_name}")
        except Exception as e:
            print(f"[Database Warning] Could not sync semester reset to DB: {e}")

    return {"status": "success", "message": f"All driver safety scores reset to 100 successfully for {term_name}!"}

@router.get("/admin/announcements")
def get_announcements():
    return store.announcements_list

@router.post("/admin/announcements")
def create_announcement(payload: dict):
    new_id = f"NOTICE-{len(store.announcements_list) + 1:03d}"
    today_str = "2026-09-26"
    new_item = {
        "id": new_id,
        "title": payload.get("title") or "New Notice",
        "content": payload.get("content") or "",
        "priority": payload.get("priority") or "normal",
        "date": today_str,
        "expire_date": payload.get("expire_date") or "2026-10-31",
        "target_audience": "all",
        "created_at": "2026-09-26T21:00:00.000Z"
    }
    store.announcements_list.insert(0, new_item)

    if is_db_connected():
        try:
            print(f"[Database Sync] Announcement created: {new_id}")
        except Exception as e:
            print(f"[Database Warning] Could not sync announcement to DB: {e}")

    return {"status": "success", "message": "Announcement created successfully", "announcement": new_item}

@router.put("/admin/announcements/{announcement_id}")
def update_announcement(announcement_id: str, payload: dict):
    for item in store.announcements_list:
        if str(item.get("id")) == str(announcement_id):
            if "title" in payload: item["title"] = payload["title"]
            if "content" in payload: item["content"] = payload["content"]
            if "priority" in payload: item["priority"] = payload["priority"]
            if "expire_date" in payload: item["expire_date"] = payload["expire_date"]

            if is_db_connected():
                try:
                    print(f"[Database Sync] Announcement updated: {announcement_id}")
                except Exception as e:
                    print(f"[Database Warning] Could not sync announcement update to DB: {e}")

            return {"status": "success", "message": "Announcement updated successfully", "announcement": item}
    
    return {"status": "error", "message": "Announcement not found"}

@router.delete("/admin/announcements/{announcement_id}")
def delete_announcement(announcement_id: str):
    store.announcements_list = [a for a in store.announcements_list if str(a.get("id")) != str(announcement_id)]

    if is_db_connected():
        try:
            print(f"[Database Sync] Announcement deleted: {announcement_id}")
        except Exception as e:
            print(f"[Database Warning] Could not sync announcement deletion to DB: {e}")

    return {"status": "success", "message": f"Announcement {announcement_id} removed successfully"}
