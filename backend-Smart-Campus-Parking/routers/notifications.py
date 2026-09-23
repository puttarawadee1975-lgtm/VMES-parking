from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query
from database import (
    notifications_collection,
    users_collection,
    detection_logs_collection,
    saved_spots_collection,
    system_settings_collection,
    notification_templates_collection
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_template(noti_type: str, default_title: str, default_message: str, **kwargs) -> tuple:
    """
    Fetches dynamic notification template from MongoDB Atlas (notification_templates collection).
    Falls back to default Python string if missing.
    """
    title = default_title
    message = default_message

    if notification_templates_collection is not None:
        tpl = notification_templates_collection.find_one({"type": noti_type})
        if tpl:
            title = tpl.get("title", default_title)
            message = tpl.get("message", default_message)

    try:
        if kwargs:
            message = message.format(**kwargs)
    except Exception:
        pass

    return title, message

def is_enforcement_enabled() -> bool:

    if system_settings_collection is not None:
        setting = system_settings_collection.find_one({"key": "enforcement_system"})
        if setting and "active" in setting:
            return bool(setting["active"])
    return True

def get_parking_policy() -> dict:
    """
    Fetches dynamic parking policy thresholds from MongoDB Atlas (system_settings collection).
    """
    if system_settings_collection is not None:
        policy = system_settings_collection.find_one({"key": "parking_policy"})
        if policy:
            return policy
    return {
        "peak_hours_cutoff": "16:30",
        "helmet_penalty_points": 10
    }

def check_and_create_vmes_parking_notification(user_email: str, zone: str = "VMES Building") -> Optional[dict]:
    """
    Overstay parking rules (30-min limit & overstay penalties) have been disabled.
    No 30-minute grace warning or overtime penalty notifications will be created.
    """
    return None


def trigger_helmet_violation_notification(user_email: str, license_plate: str, gate_name: str = "VMES Entry Gate"):
    """
    Creates MongoDB notification for No Helmet Violation & applies 10-point safety deduction.
    EXCEPTIONAL SAFETY RULE: Helmet detection is ALWAYS active 24/7 regardless of Parking Access Mode status.
    """
    if not user_email or notifications_collection is None:
        return None

    user_email_clean = user_email.strip().lower()
    now = datetime.now(timezone.utc)
    
    if users_collection is not None:
        user_doc = users_collection.find_one({"email": user_email_clean})
        if user_doc:
            current_score = user_doc.get("driving_score", 100)
            new_score = max(0, current_score - 10)
            users_collection.update_one({"_id": user_doc["_id"]}, {"$set": {"driving_score": new_score}})
            print(f"[HELMET VIOLATION DEDUCTION] Deducted 10 points from {user_email_clean}")

    title, message = get_template(
        "helmet_violation",
        "No Helmet Detected (-10 Points)",
        "AI CCTV detected driving without a helmet at {gate_name} for plate {plate}. 10 safety points deducted.",
        gate_name=gate_name,
        plate=license_plate
    )

    noti_doc = {
        "user_email": user_email_clean,
        "title": title,
        "message": message,
        "type": "helmet_violation",
        "category": "Safety Alert",
        "scoreDeducted": 10,
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

    # Automatically purge expired announcement notifications from MongoDB Atlas
    today_str = datetime.now().strftime("%Y-%m-%d")
    notifications_collection.delete_many({
        "expire_date": {"$exists": True, "$ne": "", "$lt": today_str}
    })

    cursor = notifications_collection.find({
        "$or": [
            {"user_email": target_email},
            {"user_email": None},
            {"target_audience": "all"}
        ],
        "type": {"$nin": ["vmes_parking_30min_warning", "vmes_overtime_penalty"]}
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
