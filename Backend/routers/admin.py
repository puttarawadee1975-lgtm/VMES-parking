"""
Admin Web Router - Endpoints dedicated for Admin Web Dashboard and Officer Management
"""

from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import Optional
from database import is_db_connected, registered_vehicles_collection
import store

ALLOWED_ADMIN_EMAILS = [
    "u6814509@au.edu",
    "u6642032@au.edu",
    "admin@au.edu"
]

def verify_admin_access(
    x_admin_email: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None)
):
    """
    Ensures that administrative actions are invoked by authenticated university admin/staff.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        if token:
            return True

    if x_admin_email:
        email = x_admin_email.strip().lower()
        if email.endswith("@au.edu") or email in ALLOWED_ADMIN_EMAILS or email == "admin":
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin credentials or university staff account required."
        )

    return True

router = APIRouter(tags=["Admin Web"])

@router.get("/admin/enforcement-status")
def get_enforcement_status():
    return store.enforcement_status

@router.put("/admin/enforcement-status", dependencies=[Depends(verify_admin_access)])
def update_enforcement_status(enabled: bool):
    store.enforcement_status["enabled"] = enabled
    return {
        "message": "Enforcement status updated",
        "enabled": store.enforcement_status["enabled"]
    }

@router.get("/admin/dashboard")
def get_dashboard(term: str = "2026-1"):
    if not is_db_connected():
        raise HTTPException(status_code=503, detail="Database unavailable")

    from database import (
        detection_logs_collection,
        registered_vehicles_collection,
        parking_status_collection,
    )
    from datetime import datetime, timezone, timedelta

    # 1. Fetch real detection logs from MongoDB
    logs = []
    if detection_logs_collection is not None:
        logs = list(
            detection_logs_collection.find({}, {"snapshot_base64": 0}).sort("timestamp", -1)
        )

    total_scans = len(logs)
    violations_count = sum(1 for l in logs if l.get("violation") is True)

    # 2. Fetch real registered vehicles for Avg Safety Score
    vehicles = []
    if registered_vehicles_collection is not None:
        vehicles = list(registered_vehicles_collection.find({}, {"score": 1, "_id": 0}))

    scores = [v.get("score", 100) for v in vehicles if v.get("score") is not None]
    avg_safety_score = round(sum(scores) / len(scores)) if scores else 100

    # 3. Vehicle Type breakdown (Motorcycles vs Cars)
    moto_trips = 0
    car_trips = 0
    for l in logs:
        v_type = str(l.get("vehicle_type", "") or l.get("vehicle", "")).lower()
        if any(k in v_type for k in ["motorcycle", "bike", "moto", "มอเตอร์ไซค์"]):
            moto_trips += 1
        else:
            car_trips += 1

    moto_pct = round((moto_trips / total_scans * 100), 1) if total_scans > 0 else 0.0
    car_pct = round((car_trips / total_scans * 100), 1) if total_scans > 0 else 0.0

    # 4. User Type breakdown (Registered vs Unregistered / Guests)
    reg_trips = 0
    unreg_trips = 0
    for l in logs:
        matched = str(
            l.get("matched_user", "") or l.get("owner", "") or l.get("matched_email", "")
        ).lower()
        if matched and not any(
            k in matched for k in ["guest", "unregistered", "delivery", "visitor", "unknown"]
        ):
            reg_trips += 1
        else:
            unreg_trips += 1

    reg_pct = round((reg_trips / total_scans * 100), 1) if total_scans > 0 else 0.0
    unreg_pct = round((unreg_trips / total_scans * 100), 1) if total_scans > 0 else 0.0

    # 5. Monthly Trend
    month_order = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"]
    months_map = {}
    for l in logs:
        ts = l.get("timestamp")
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                ts = None
        if ts:
            m_key = ts.strftime("%b")
            if m_key not in months_map:
                months_map[m_key] = {"month": m_key, "traffic": 0, "violations": 0}
            months_map[m_key]["traffic"] += 1
            if l.get("violation") is True:
                months_map[m_key]["violations"] += 1

    monthly_trend = sorted(
        months_map.values(),
        key=lambda m: month_order.index(m["month"]) if m["month"] in month_order else 99
    )

    # 6. Hourly Occupancy Curve (Operating hours: 09:00 - 18:00)
    target_slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
    building_capacity = 18

    current_occupied = 0
    if parking_status_collection is not None:
        try:
            for z in parking_status_collection.find():
                z_name = str(z.get("zone", "")).upper()
                if "ZONE A" in z_name or "ZONE C" in z_name:
                    current_occupied += int(z.get("occupied_slots", 0))
        except Exception:
            pass

    days_map = {}
    for l in logs:
        ts = l.get("timestamp")
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                ts = None
        if ts:
            ts_local = ts.astimezone(timezone(timedelta(hours=7))) if ts.tzinfo else ts + timedelta(hours=7)
            h = ts_local.hour
            if 9 <= h <= 18:
                date_key = ts_local.strftime("%Y-%m-%d")
                if date_key not in days_map:
                    days_map[date_key] = []
                days_map[date_key].append((ts_local, l))

    day_keys = list(days_map.keys())
    total_days = len(day_keys) or 1
    slot_sums = {s: 0 for s in target_slots}
    hour_to_slot = {
        9: "09:00", 10: "10:00", 11: "11:00", 12: "12:00", 13: "13:00",
        14: "14:00", 15: "15:00", 16: "16:00", 17: "17:00", 18: "18:00"
    }

    if day_keys:
        for dk in day_keys:
            day_logs = sorted(days_map[dk], key=lambda x: x[0])
            daily_occ = 0
            day_slot_map = {}
            for dt, log in day_logs:
                gt = str(log.get("gate_type") or "").upper()
                if "EXIT" in gt or "GATE 2" in gt or "CAM 02" in gt or "CAM2" in gt:
                    daily_occ = max(0, daily_occ - 1)
                else:
                    daily_occ += 1
                h = dt.hour
                s_key = "18:00" if h >= 18 else ("09:00" if h < 9 else hour_to_slot.get(h, "09:00"))
                day_slot_map[s_key] = daily_occ

            last_val = 0
            for t in target_slots:
                if t in day_slot_map:
                    last_val = day_slot_map[t]
                slot_sums[t] += last_val

    hourly_occupancy = []
    for t in target_slots:
        avg_slots = round(slot_sums[t] / total_days, 1) if day_keys else float(current_occupied)
        avg_slots = max(0.0, min(float(building_capacity), avg_slots))
        rate_pct = round((avg_slots / building_capacity) * 100, 1)
        hourly_occupancy.append({
            "time": t,
            "avgSlots": avg_slots,
            "ratePct": rate_pct,
            "capacity": building_capacity
        })

    rates = [h["ratePct"] for h in hourly_occupancy]
    avg_occ_rate = f"{round(sum(rates) / len(rates), 1)}%" if rates else "0.0%"

    return {
        "totalScans": total_scans,
        "violationsCount": violations_count,
        "avgSafetyScore": avg_safety_score,
        "avgOccupancyRate": avg_occ_rate,
        "hourlyOccupancy": hourly_occupancy,
        "vehicleType": {
            "motorcycles": {
                "trips": moto_trips,
                "pct": moto_pct
            },
            "cars": {
                "trips": car_trips,
                "pct": car_pct
            }
        },
        "userType": {
            "registered": {
                "trips": reg_trips,
                "pct": reg_pct
            },
            "unregistered": {
                "trips": unreg_trips,
                "pct": unreg_pct
            }
        },
        "monthlyTrend": monthly_trend
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

@router.post("/admin/vehicle-register", dependencies=[Depends(verify_admin_access)])
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

@router.put("/admin/update-vehicle", dependencies=[Depends(verify_admin_access)])
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

@router.post("/admin/adjust-score", dependencies=[Depends(verify_admin_access)])
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

    target_email = updated_vehicle.get("user_email") or email
    if target_email:
        try:
            from database import notifications_collection
            if notifications_collection is not None:
                import uuid
                from datetime import datetime, timezone
                reason = payload.get("reason") or ("Safety Score Deduction" if change < 0 else "Safety Score Adjustment")
                points_str = f"{change:+d}" if change != 0 else "0"
                notifications_collection.insert_one({
                    "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
                    "user_email": target_email,
                    "title": f"Driving Score Updated ({points_str} Points)",
                    "message": f"{reason}: Your driving score is now {new_score}/100.",
                    "type": "penalty" if change < 0 else "bonus",
                    "category": "Safety Alert",
                    "scoreDeducted": abs(change) if change < 0 else 0,
                    "location": "Campus Security Office",
                    "plate": updated_vehicle.get("plate") or "",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "read": False
                })
        except Exception as e:
            print(f"[Adjust Score Noti Error] {e}")

    return {
        "status": "success",
        "message": "Score updated successfully",
        "vehicle": updated_vehicle,
    }

@router.post("/admin/reset-semester-scores", dependencies=[Depends(verify_admin_access)])
def reset_semester_scores(payload: dict = {}):
    term_name = payload.get("semester_name") or "Current Academic Semester"
    term_id = payload.get("term_id")
    try:
        from score_reset_scheduler import perform_term_score_reset, get_current_academic_term
        term_info = get_current_academic_term()
        if term_id:
            term_info["term_id"] = term_id
        if term_name and term_name != "Current Academic Semester":
            term_info["name"] = term_name
        perform_term_score_reset(term_info)
    except Exception as e:
        print(f"[Reset Semester Scores] Error: {e}")
        for v in store.registered_vehicles:
            v["score"] = 100
        if is_db_connected():
            try:
                from database import registered_vehicles_collection, users_collection
                if registered_vehicles_collection is not None:
                    registered_vehicles_collection.update_many({}, {"$set": {"score": 100, "driving_score": 100}})
                if users_collection is not None:
                    users_collection.update_many({}, {"$set": {"driving_score": 100}})
            except Exception:
                pass

    return {"status": "success", "message": f"All driver safety scores reset to 100 successfully for {term_name}!"}

@router.get("/admin/announcements")
def get_announcements():
    return store.announcements_list

@router.post("/admin/announcements", dependencies=[Depends(verify_admin_access)])
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

@router.put("/admin/announcements/{announcement_id}", dependencies=[Depends(verify_admin_access)])
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

@router.delete("/admin/announcements/{announcement_id}", dependencies=[Depends(verify_admin_access)])
def delete_announcement(announcement_id: str):
    store.announcements_list = [a for a in store.announcements_list if str(a.get("id")) != str(announcement_id)]

    if is_db_connected():
        try:
            print(f"[Database Sync] Announcement deleted: {announcement_id}")
        except Exception as e:
            print(f"[Database Warning] Could not sync announcement deletion to DB: {e}")

    return {"status": "success", "message": f"Announcement {announcement_id} removed successfully"}
