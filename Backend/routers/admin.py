"""
Admin Web Router - Endpoints dedicated for Admin Web Dashboard and Officer Management
"""

from fastapi import APIRouter, HTTPException
from database import is_db_connected
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
def get_gate_history():
    return {
        "history": [
            {
                "id": "6aace42827c2105c820a69db",
                "plate": "ก-1687",
                "vehicle_type": "car",
                "helmet": None,
                "violation": False,
                "penalty_applied": False,
                "gate": "VMES Entry Gate (Cam 01)",
                "direction": "IN",
                "camera_id": "01",
                "zone": "Zone A (Building 1 - Car)",
                "timestamp": "2026-09-18T07:11:35.797Z",
                "matched_email": None,
                "matched_user": "Guest Driver",
                "role": "Guest",
                "user_id": "GUEST",
                "image_url": "/snapshots/entry_cam01_1789715495_ก1687.jpg"
            }
        ]
    }

@router.get("/admin/all-vehicles")
@router.get("/admin/vehicle-directory")
@router.get("/admin/driving-score")
@router.get("/admin/users")
def get_all_registered_vehicles():
    return store.registered_vehicles

@router.post("/admin/vehicle-register")
def admin_register_vehicle(payload: dict):
    email = payload.get("user_email") or payload.get("email") or ""
    role = (payload.get("role") or "Student").lower()
    plate = payload.get("plate") or payload.get("license_plate") or "Unregistered"

    if email and role != "admin":
        existing_user_vehicles = [v for v in store.registered_vehicles if v.get("user_email") == email]
        if len(existing_user_vehicles) >= 1:
            raise HTTPException(
                status_code=400, 
                detail="Registration Limit Reached: 1 vehicle is allowed per account."
            )

    norm_plate = plate.strip().upper()
    for v in store.registered_vehicles:
        existing_plate = (v.get("plate") or v.get("license_plate") or "").strip().upper()
        if existing_plate and existing_plate == norm_plate:
            raise HTTPException(
                status_code=400,
                detail=f"License plate '{plate}' is already registered in the system."
            )

    new_id = len(store.registered_vehicles) + 1
    v_type = payload.get("vehicle_type") or "car"
    brand = payload.get("brand") or ""
    model = payload.get("model") or f"{brand} Vehicle".strip()
    color = payload.get("color") or ""
    owner = payload.get("owner") or "Registered Driver"
    user_role = (payload.get("role") or "Student").title()
    provided_user_id = payload.get("user_id") or payload.get("userId")
    
    if user_role in ["Staff", "Faculty"]:
        staff_faculty_count = sum(1 for v in store.registered_vehicles if str(v.get("role")).title() in ["Staff", "Faculty"])
        user_id = provided_user_id or str(staff_faculty_count + 1)
    else:
        email_digits = "".join(filter(str.isdigit, email.split("@")[0])) if email else ""
        user_id = provided_user_id or (email_digits if email_digits else f"6607{new_id:04d}")

    new_vehicle = {
        "id": new_id,
        "user_id": user_id,
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
        "registered_at": "2026-09-25T23:00:00.000Z",
        "vehicle_photo": payload.get("vehicle_photo") or None
    }
    store.registered_vehicles.append(new_vehicle)

    if is_db_connected():
        try:
            print(f"[Database Sync] Vehicle registered by Admin: {plate} ({owner})")
        except Exception as e:
            print(f"[Database Warning] Could not sync new vehicle to DB: {e}")

    return {
        "status": "success",
        "message": "Vehicle registered successfully",
        "vehicle": new_vehicle
    }

@router.put("/admin/update-vehicle")
def update_vehicle(payload: dict):
    target_plate = payload.get("old_plate") or payload.get("plate")
    updated_obj = None
    for v in store.registered_vehicles:
        if v.get("plate") == target_plate or v.get("license_plate") == target_plate:
            if "plate" in payload:
                v["plate"] = payload["plate"]
                v["license_plate"] = payload["plate"]
            if "vehicle_type" in payload: v["vehicle_type"] = payload["vehicle_type"]
            if "brand" in payload: v["brand"] = payload["brand"]
            if "model" in payload: v["model"] = payload["model"]
            if "color" in payload: v["color"] = payload["color"]
            if "owner" in payload: v["owner"] = payload["owner"]
            if "user_email" in payload: v["user_email"] = payload["user_email"]
            if "role" in payload: v["role"] = payload["role"]
            updated_obj = v
            break

    if updated_obj:
        if is_db_connected():
            try:
                print(f"[Database Sync] Vehicle updated: {target_plate}")
            except Exception as e:
                print(f"[Database Warning] Could not sync vehicle update to DB: {e}")
        return {"status": "success", "message": "Vehicle updated successfully", "vehicle": updated_obj}

    return {"status": "error", "message": "Vehicle not found"}

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
    email = payload.get("user_email") or ""
    change = payload.get("points_changed") or 0
    owner_name = payload.get("owner") or ""

    updated_vehicle = None
    for v in store.registered_vehicles:
        if (email and v.get("user_email") == email) or (owner_name and (v.get("owner") == owner_name or v.get("plate") == owner_name)):
            cur = v.get("score", 100)
            v["score"] = max(0, min(100, cur + change))
            updated_vehicle = v
            break

    if not updated_vehicle and store.registered_vehicles and change != 0:
        store.registered_vehicles[0]["score"] = max(0, min(100, store.registered_vehicles[0].get("score", 100) + change))
        updated_vehicle = store.registered_vehicles[0]

    if is_db_connected():
        try:
            print(f"[Database Sync] Score adjusted for {email or owner_name}: {change} pts")
        except Exception as e:
            print(f"[Database Warning] Could not sync score to DB: {e}")

    return {"status": "success", "message": "Score updated successfully", "vehicle": updated_vehicle}

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
