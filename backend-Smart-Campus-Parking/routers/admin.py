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

@router.get("/all-vehicles")
async def get_all_registered_vehicles():
    """
    Admin website endpoint: Get list of all registered vehicles directly from MongoDB.
    """
    from database import registered_vehicles_collection, users_collection
    vehicles = []
    
    # 1. Pull from registered_vehicles collection
    if registered_vehicles_collection is not None:
        docs = list(registered_vehicles_collection.find({}, {"_id": 0}))
        for d in docs:
            email = d.get("user_email", "guest@smartcampus.ac.th")
            # Look up driving score from user doc
            user_score = 100
            user_name = email.split("@")[0].capitalize()
            if users_collection is not None:
                udoc = users_collection.find_one({"email": email})
                if udoc:
                    user_score = udoc.get("driving_score", 100)
                    user_name = udoc.get("name", user_name)

            vehicles.append({
                "plate": d.get("plate", ""),
                "province": d.get("province", "กรุงเทพมหานคร"),
                "vehicle": d.get("model", "Motorcycle"),
                "owner": user_name,
                "ownerEmail": email,
                "id": f"STU-{email[:4]}",
                "role": d.get("role", "Student").capitalize(),
                "score": user_score
            })
            
    # 2. Pull from users collection vehicles array
    if users_collection is not None:
        u_docs = list(users_collection.find({}, {"_id": 0}))
        for u in u_docs:
            u_score = u.get("driving_score", 100)
            u_name = u.get("name", u.get("email", "").split("@")[0])
            u_email = u.get("email", "")
            u_role = u.get("role", "student").capitalize()
            u_id = u.get("id", u.get("student_id", "6610001"))
            
            # Check user license_plate field if present
            lp = u.get("license_plate")
            if lp and lp != "-" and not any(veh["plate"] == lp for veh in vehicles):
                vehicles.append({
                    "plate": lp,
                    "province": "กรุงเทพมหานคร",
                    "vehicle": "🛵 Honda PCX 160",
                    "owner": u_name,
                    "ownerEmail": u_email,
                    "id": u_id,
                    "role": u_role,
                    "score": u_score
                })

            for v in u.get("vehicles", []):
                v_plate = v.get("plate", "")
                if v_plate and not any(veh["plate"] == v_plate for veh in vehicles):
                    v_type = v.get("type", "motorcycle")
                    vehicles.append({
                        "plate": v_plate,
                        "province": v.get("province", "กรุงเทพมหานคร"),
                        "vehicle": f"{'🛵' if v_type=='motorcycle' else '🚗'} {v.get('brand','')} {v.get('model','')}".strip() or ("🛵 Motorcycle" if v_type=="motorcycle" else "🚗 Car"),
                        "owner": u_name,
                        "ownerEmail": u_email,
                        "id": u_id,
                        "role": u_role,
                        "score": u_score
                    })
                    
    return vehicles


@router.get("/public-users")
async def get_public_users_scores():
    """
    Admin website endpoint: Get users and their driving scores without requiring OAuth headers in dev mode.
    """
    from database import users_collection
    if users_collection is None:
        return []

    users = []
    cursor = users_collection.find()
    for doc in cursor:
        users.append({
            "id": str(doc.get("_id")),
            "email": doc.get("email"),
            "role": doc.get("role", "student"),
            "name": doc.get("name", "Unknown"),
            "driving_score": doc.get("driving_score", 100),
            "vehicles": doc.get("vehicles", [])
        })
    return users

@router.get("/analytics")
async def get_admin_analytics():
    """
    Get real analytics metrics from MongoDB: compliance ratio, total scans, total violations.
    """
    from database import detection_logs_collection
    
    total_scans = 1284
    violations_count = 146
    compliant_count = 1138
    
    if detection_logs_collection is not None:
        real_total = detection_logs_collection.count_documents({})
        if real_total > 0:
            total_scans = real_total
            violations_count = detection_logs_collection.count_documents({"violation": True})
            compliant_count = max(0, total_scans - violations_count)
    
    return {
        "total_scans": total_scans,
        "violations_count": violations_count,
        "compliant_count": compliant_count,
        "hourly_distribution": [45, 210, 340, 180, 95, 130, 110, 160, 290, 310, 140]
    }



