from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query
from database import (
    notifications_collection,
    users_collection,
    detection_logs_collection,
    saved_spots_collection,
    system_settings_collection
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def is_enforcement_enabled() -> bool:
    if system_settings_collection is not None:
        setting = system_settings_collection.find_one({"key": "enforcement_system"})
        if setting and "active" in setting:
            return bool(setting["active"])
    return True

def check_and_create_vmes_parking_notification(user_email: str, zone: str = "VMES Building") -> Optional[dict]:
    """
    Evaluates Student VMES Parking Policy:
    1. Mon-Fri Before 16:30:
       - Initial entry notification: 30-minute parking grace period warning.
       - Overtime check (> 30 mins): Deduct 10 safety points & generate overtime penalty notification (if Enforcement is Active).
    2. Sat-Sun: Free & Unlimited parking anytime. No penalties or warnings.
    """
    if not user_email or notifications_collection is None:
        return None

    user_email_clean = user_email.strip().lower()
    user_doc = None
    if users_collection is not None:
        user_doc = users_collection.find_one({"email": user_email_clean})

    user_role = user_doc.get("role", "student") if user_doc else "student"
    if user_role != "student":
        return None

    # Check vehicle type: Motorcycles park free & unlimited 24/7 (No overtime penalty, helmet check only)
    is_motorcycle = False
    if user_doc and user_doc.get("vehicles"):
        v_model = (user_doc["vehicles"][0].get("model") or "").lower()
        if any(kw in v_model for kw in ["motorcycle", "motorbike", "scooter", "vespa", "bike", "2-wheeler"]):
            is_motorcycle = True

    if is_motorcycle:
        print(f"[VMES POLICY] Student {user_email_clean} registered vehicle is a motorcycle. Free & unlimited parking applied (no overtime penalty).")
        return None

    now = datetime.now(timezone.utc)
    weekday = now.weekday()  # 0=Monday ... 4=Friday, 5=Saturday, 6=Sunday
    is_weekday = weekday < 5
    is_before_430pm = (now.hour < 16) or (now.hour == 16 and now.minute < 30)

    if is_weekday and is_before_430pm:
        # 1. Send Initial 30-Minute Grace Period Notification (Car Parking - Once Per Day Max)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        existing_warning = notifications_collection.find_one({
            "user_email": user_email_clean,
            "type": "vmes_parking_30min_warning",
            "timestamp": {"$gte": today_start}
        })
        
        created_noti = None
        if not existing_warning:
            noti_doc = {
                "user_email": user_email_clean,
                "title": "VMES Car Parking Limit: 30 Mins Max",
                "message": "Student car parking at VMES is permitted for up to 30 minutes before 16:30 on weekdays. Exceeding 30 minutes for cars will result in a 10-point safety deduction. Motorcycles park free & unlimited anytime.",
                "type": "vmes_parking_30min_warning",
                "category": "Parking Alert",
                "zone": zone,
                "timestamp": now,
                "read": False
            }
            res = notifications_collection.insert_one(noti_doc)
            noti_doc["_id"] = str(res.inserted_id)
            created_noti = noti_doc
            print(f"[VMES NOTIFICATION] 30-minute car grace warning sent to {user_email_clean}")

        # 2. Check for Overtime Parking (> 30 Mins) and Apply 10-Point Deduction for Cars
        thirty_mins_ago = now - timedelta(minutes=30)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Look for active parked spot or entry detection from > 30 minutes ago today
        old_entry = None
        if saved_spots_collection is not None:
            old_entry = saved_spots_collection.find_one({
                "user_email": user_email_clean,
                "timestamp": {"$gte": today_start, "$lte": thirty_mins_ago}
            })
        if not old_entry and detection_logs_collection is not None:
            old_entry = detection_logs_collection.find_one({
                "matched_email": user_email_clean,
                "gate_type": {"$regex": "ENTRY", "$options": "i"},
                "timestamp": {"$gte": today_start, "$lte": thirty_mins_ago}
            })

        if old_entry:
            # Re-verify if specific entry log detected a motorcycle
            detected_vtype = (old_entry.get("vehicle_type") or old_entry.get("vehicle_class") or "").lower()
            if any(kw in detected_vtype for kw in ["motorcycle", "motorbike", "scooter", "vespa", "bike", "2-wheeler"]):
                print(f"[VMES POLICY] Detected entry for {user_email_clean} was a motorcycle. No overtime penalty.")
                return created_noti

            # Check if overtime penalty already applied today
            existing_penalty = notifications_collection.find_one({
                "user_email": user_email_clean,
                "type": "vmes_overtime_penalty",
                "timestamp": {"$gte": today_start}
            })
            if not existing_penalty and user_doc:
                if not is_enforcement_enabled():
                    print(f"[FREE PARKING EVENT MODE] Master toggle is OFF. Overtime point deduction skipped for {user_email_clean}")
                    return created_noti

                # Deduct 10 safety points for car overtime
                current_score = user_doc.get("driving_score", 100)
                new_score = max(0, current_score - 10)
                users_collection.update_one(
                    {"_id": user_doc["_id"]},
                    {"$set": {"driving_score": new_score}}
                )
                
                penalty_doc = {
                    "user_email": user_email_clean,
                    "title": "VMES Car Parking Overtime (-10 Points)",
                    "message": "Exceeded the 30-minute weekday car parking limit at VMES Building before 16:30. 10 safety driving points have been deducted.",
                    "type": "vmes_overtime_penalty",
                    "category": "Safety Alert",
                    "scoreDeducted": 10,
                    "zone": zone,
                    "timestamp": now,
                    "read": False
                }
                res = notifications_collection.insert_one(penalty_doc)
                penalty_doc["_id"] = str(res.inserted_id)
                print(f"[VMES OVERTIME DEDUCTION] Deducted 10 points from student car owner {user_email_clean}")
                return penalty_doc

        return created_noti

    return None

def trigger_helmet_violation_notification(user_email: str, license_plate: str, gate_name: str = "VMES Entry Gate"):
    """
    Creates MongoDB notification for No Helmet Violation & applies 10-point safety deduction if Enforcement System is Active.
    """
    if not user_email or notifications_collection is None:
        return None

    user_email_clean = user_email.strip().lower()
    now = datetime.now(timezone.utc)
    
    score_deducted = 10 if is_enforcement_enabled() else 0
    if is_enforcement_enabled() and users_collection is not None:
        user_doc = users_collection.find_one({"email": user_email_clean})
        if user_doc:
            current_score = user_doc.get("driving_score", 100)
            new_score = max(0, current_score - 10)
            users_collection.update_one({"_id": user_doc["_id"]}, {"$set": {"driving_score": new_score}})
            print(f"[HELMET VIOLATION DEDUCTION] Deducted 10 points from {user_email_clean}")

    noti_doc = {
        "user_email": user_email_clean,
        "title": "No Helmet Violation Detected" if score_deducted == 0 else "No Helmet Detected (-10 Points)",
        "message": f"AI CCTV detected driving without a helmet at {gate_name} for plate {license_plate}." + (" (Event Mode: Point deduction paused)" if score_deducted == 0 else " 10 safety points deducted."),
        "type": "helmet_violation",
        "category": "Safety Alert",
        "scoreDeducted": score_deducted,
        "plate": license_plate,
        "zone": gate_name,
        "timestamp": now,
        "read": False
    }
    res = notifications_collection.insert_one(noti_doc)
    noti_doc["_id"] = str(res.inserted_id)
    return noti_doc

@router.get("")
async def get_notifications_by_query(email: Optional[str] = Query(None)):
    """
    Retrieve user notifications from MongoDB Atlas via query param.
    """
    return await fetch_notifications_for_email(email)

@router.get("/user/{email}")
async def get_user_notifications_path(email: str):
    """
    Retrieve user notifications from MongoDB Atlas via path param.
    """
    return await fetch_notifications_for_email(email)

async def fetch_notifications_for_email(email: Optional[str]):
    if notifications_collection is None:
        return []

    target_email = (email or "u6814509@au.edu").strip().lower()

    cursor = notifications_collection.find({
        "$or": [
            {"user_email": target_email},
            {"user_email": None},
            {"target_audience": "all"}
        ]
    }).sort("timestamp", -1).limit(50)

    results = []
    for doc in cursor:
        results.append({
            "id": str(doc.get("_id")),
            "title": doc.get("title", "Notice"),
            "message": doc.get("message", ""),
            "type": doc.get("type", "announcement"),
            "category": doc.get("category", "Campus Notice"),
            "scoreDeducted": doc.get("scoreDeducted", 0),
            "plate": doc.get("plate", ""),
            "zone": doc.get("zone", "VMES Building"),
            "timestamp": doc.get("timestamp", datetime.now(timezone.utc)).isoformat() if isinstance(doc.get("timestamp"), datetime) else str(doc.get("timestamp")),
            "read": doc.get("read", False)
        })

    return results

@router.post("/evaluate-vmes-parking")
async def trigger_vmes_rule_evaluation(user_email: str, zone: str = "VMES Building"):
    """
    Explicit endpoint to evaluate student VMES parking rule and record notification to MongoDB Atlas.
    """
    noti = check_and_create_vmes_parking_notification(user_email, zone)
    return {
        "status": "evaluated",
        "notification_created": bool(noti),
        "notification": noti
    }

@router.post("/mark-read/{notification_id}")
async def mark_notification_read(notification_id: str):
    """
    Mark notification as read in MongoDB Atlas.
    """
    if notifications_collection is None:
        return {"message": "Database disconnected"}

    from bson import ObjectId
    try:
        notifications_collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}}
        )
    except Exception:
        notifications_collection.update_one(
            {"id": notification_id},
            {"$set": {"read": True}}
        )
    return {"message": "Notification marked as read"}
