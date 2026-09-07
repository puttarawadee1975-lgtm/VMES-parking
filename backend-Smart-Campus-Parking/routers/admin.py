from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from database import users_collection
from schemas import UserResponse, UserCreate
from auth import require_roles

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    current_user: dict = Depends(require_roles(["office"]))
):
    """
    Office Role only: Retrieve all registered users, roles, driving scores, and vehicles.
    """
    if users_collection is None:
        return []

    users = []
    cursor = users_collection.find()
    for doc in cursor:
        users.append(
            UserResponse(
                id=str(doc.get("_id")),
                email=doc.get("email"),
                role=doc.get("role", "student"),
                name=doc.get("name", "Unknown"),
                driving_score=doc.get("driving_score", 100),
                vehicles=doc.get("vehicles", [])
            )
        )
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_roles(["office"]))
):
    """
    Office Role only: Register or update a user profile, role, or vehicle list.
    """
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    doc = user_data.model_dump()
    existing = users_collection.find_one({"email": user_data.email.lower()})

    if existing:
        users_collection.update_one(
            {"email": user_data.email.lower()},
            {"$set": doc}
        )
        doc["id"] = str(existing["_id"])
    else:
        res = users_collection.insert_one(doc)
        doc["id"] = str(res.inserted_id)

    return doc

# --- Announcements Endpoints (Public GET / Admin POST) ---
MOCK_ANNOUNCEMENTS = []

@router.get("/announcements")
async def get_announcements():
    """
    Public endpoint: Get all campus announcements set by Admin website.
    """
    return MOCK_ANNOUNCEMENTS

@router.post("/announcements")
async def create_announcement(announcement: dict):
    """
    Admin website endpoint: Post new campus announcement.
    """
    new_ann = {
        "id": f"ANN-{len(MOCK_ANNOUNCEMENTS) + 1:02d}",
        "title": announcement.get("title", "Campus Notice"),
        "content": announcement.get("content", ""),
        "date": "Just Now",
        "priority": announcement.get("priority", "normal")
    }
    MOCK_ANNOUNCEMENTS.insert(0, new_ann)
    return {"status": "success", "announcement": new_ann}

# --- Driving Score Audit Log Endpoints ---
SCORE_LOGS = []

@router.post("/adjust-score")
async def adjust_user_score(payload: dict):
    """
    Admin website endpoint: Deduct or restore driving safety score for a student/user,
    and log the audit entry in memory and MongoDB.
    """
    email = payload.get("user_email", "").strip().lower()
    points = payload.get("points_changed", 0)
    reason = payload.get("reason", "Admin manual adjustment")
    gate = payload.get("gate_name", "Gate 1 (Main Entrance)")
    image_url = payload.get("image_url", None)

    if not email:
        raise HTTPException(status_code=400, detail="User email is required")

    current_score = 100
    if users_collection is not None:
        user_doc = users_collection.find_one({"email": email})
        if user_doc:
            current_score = user_doc.get("driving_score", 100)
            new_score = max(0, min(100, current_score + points))
            users_collection.update_one({"email": email}, {"$set": {"driving_score": new_score}})
            current_score = new_score
        else:
            current_score = max(0, min(100, 100 + points))
    else:
        current_score = max(0, min(100, 100 + points))

    log_entry = {
        "id": f"SCORE-LOG-{len(SCORE_LOGS) + 1:04d}",
        "user_email": email,
        "action": "RESTORE" if points > 0 else "DEDUCT",
        "points_changed": points,
        "new_score": current_score,
        "reason": reason,
        "gate_name": gate,
        "image_url": image_url,
        "timestamp": "Just now"
    }

    SCORE_LOGS.insert(0, log_entry)
    return {"status": "success", "log": log_entry, "new_score": current_score}

@router.get("/score-logs")
async def get_all_score_logs():
    """
    Get all score adjustment audit logs.
    """
    return SCORE_LOGS

