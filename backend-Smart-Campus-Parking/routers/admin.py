from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from database import users_collection, announcements_collection
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
                email=doc.get("email", ""),
                full_name=doc.get("full_name", ""),
                role=doc.get("role", "student"),
                license_plate=doc.get("license_plate", ""),
                driving_score=doc.get("driving_score", 100)
            )
        )
    return users

@router.post("/users", response_model=UserResponse)
async def create_or_update_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_roles(["office"]))
):
    """
    Office Role only: Register or update a user manually from Admin Web.
    """
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")

    existing = users_collection.find_one({"email": user_data.email.lower()})

    doc = {
        "email": user_data.email.lower(),
        "full_name": user_data.full_name,
        "role": user_data.role,
        "license_plate": user_data.license_plate,
        "driving_score": user_data.driving_score
    }

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

# --- Announcements Endpoints (Public GET / Admin POST / Admin DELETE) ---
MOCK_ANNOUNCEMENTS = [
    {
        "id": "ANN-01",
        "title": "Zone B Maintenance Notice",
        "content": "Zone B Floor 2 will be temporarily closed for sensor maintenance tomorrow from 09:00 AM to 02:00 PM. Please park at Zone A or Zone C.",
        "date": "Today, 09:00 AM",
        "priority": "high",
        "expire_date": "2026-12-31"
    },
    {
        "id": "ANN-02",
        "title": "Helmet Safety Policy Reminder",
        "content": "All motorcycle drivers must wear a safety helmet when entering university gates. AI CCTV cameras will deduct 10 safety points for non-compliance.",
        "date": "Yesterday",
        "priority": "normal",
        "expire_date": "2026-12-31"
    }
]

@router.get("/announcements")
async def get_announcements():
    """
    Public endpoint: Get active campus announcements set by Admin website.
    Filters out expired announcements automatically.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    if announcements_collection is not None:
        docs = list(announcements_collection.find({}, {"_id": 0}))
        if docs:
            active = [a for a in docs if not a.get("expire_date") or a.get("expire_date") >= today_str]
            return active

    active = [a for a in MOCK_ANNOUNCEMENTS if not a.get("expire_date") or a.get("expire_date") >= today_str]
    return active

@router.post("/announcements")
async def create_announcement(announcement: dict):
    """
    Admin website endpoint: Post new campus announcement.
    """
    now_str = datetime.now().strftime("%H:%M")
    default_expire = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    ann_count = 1
    if announcements_collection is not None:
        ann_count = announcements_collection.count_documents({}) + 1
    else:
        ann_count = len(MOCK_ANNOUNCEMENTS) + 1

    new_ann = {
        "id": f"ANN-{ann_count:02d}",
        "title": announcement.get("title", "Campus Notice"),
        "content": announcement.get("content", ""),
        "date": f"Today, {now_str}",
        "priority": announcement.get("priority", "normal"),
        "target_audience": announcement.get("target_audience", "all"),
        "target_user": announcement.get("target_user", ""),
        "expire_date": announcement.get("expire_date", default_expire)
    }

    if announcements_collection is not None:
        announcements_collection.insert_one(dict(new_ann))
    MOCK_ANNOUNCEMENTS.insert(0, new_ann)
    return {"status": "success", "announcement": new_ann}

@router.delete("/announcements/{ann_id}")
async def delete_announcement(ann_id: str):
    """
    Admin website endpoint: Delete a campus announcement by ID.
    """
    global MOCK_ANNOUNCEMENTS
    if announcements_collection is not None:
        announcements_collection.delete_one({"id": ann_id})
    MOCK_ANNOUNCEMENTS = [a for a in MOCK_ANNOUNCEMENTS if a.get("id") != ann_id]
    return {"status": "success", "message": f"Announcement {ann_id} deleted"}

@router.put("/announcements/{ann_id}")
async def update_announcement(ann_id: str, payload: dict):
    """
    Admin website endpoint: Edit an existing campus announcement by ID.
    """
    update_data = {}
    for key in ["title", "content", "priority", "target_audience", "target_user", "expire_date"]:
        if key in payload:
            update_data[key] = payload[key]

    if announcements_collection is not None:
        announcements_collection.update_one({"id": ann_id}, {"$set": update_data})
        updated_doc = announcements_collection.find_one({"id": ann_id}, {"_id": 0})
        if updated_doc:
            return {"status": "success", "announcement": updated_doc}

    for a in MOCK_ANNOUNCEMENTS:
        if a.get("id") == ann_id:
            a.update(update_data)
            return {"status": "success", "announcement": a}
    raise HTTPException(status_code=404, detail="Announcement not found")

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

def clean_plate_and_province(raw_plate: str, raw_prov: str = "กรุงเทพมหานคร"):
    raw_plate = (raw_plate or "").strip()
    raw_prov = (raw_prov or "กรุงเทพมหานคร").strip()
    
    parts = raw_plate.split()
    if len(parts) >= 3:
        plate_str = " ".join(parts[:-1])
        prov_str = parts[-1]
        return plate_str, prov_str
    if raw_prov and raw_plate.endswith(raw_prov):
        plate_str = raw_plate[:-len(raw_prov)].strip()
        return plate_str, raw_prov
    return raw_plate, raw_prov

CAR_KEYWORDS = {"mazda", "toyota", "nissan", "honda civic", "honda cr-v", "honda hr-v", "benz", "bmw", "ford", "chevrolet", "mg", "subaru", "hyundai", "kia", "isuzu", "mitsubishi", "volvo", "audi", "tesla", "porsche", "byd", "haval", "ora", "camry", "civic", "altis", "city", "accord", "mazda2", "mazda3", "cx-5", "cx-30", "car", "รถยนต์"}

def format_vehicle_detail(v_type: str, brand: str, model: str, color: str):
    combined = f"{v_type} {brand} {model}".lower()
    is_car = v_type == "car" or any(kw in combined for kw in CAR_KEYWORDS)
    clean_type = "Car" if is_car else "Motorcycle"
    clean_model = (model or "").replace("🛵", "").replace("🚗", "").replace("รถจักรยานยนต์", "").replace("รถยนต์", "").replace("Motorcycle", "").replace("Car", "").strip()
    clean_brand = (brand or "").strip()
    clean_color = (color or "").strip()
    
    parts = [clean_type]
    if clean_brand:
        parts.append(clean_brand)
    if clean_model:
        parts.append(clean_model)
    res = " ".join(parts).strip()
    if clean_color and clean_color not in res:
        res += f" ({clean_color})"
    return res

@router.get("/all-vehicles")
async def get_all_registered_vehicles():
    """
    Admin website endpoint: Get list of all registered vehicles.
    """
    from database import registered_vehicles_collection, users_collection
    vehicles = []
    
    if registered_vehicles_collection is not None:
        docs = list(registered_vehicles_collection.find({}, {"_id": 0}))
        for d in docs:
            p_str, prov_str = clean_plate_and_province(d.get("plate", ""), d.get("province", "กรุงเทพมหานคร"))
            raw_type = d.get("vehicle_type", d.get("type", "motorcycle"))
            brand = d.get("brand", "")
            model = d.get("model", "Vehicle")
            color = d.get("color", "")
            
            combined = f"{raw_type} {brand} {model}".lower()
            v_type = "car" if (raw_type == "car" or any(kw in combined for kw in CAR_KEYWORDS)) else "motorcycle"
            full_detail = format_vehicle_detail(v_type, brand, model, color)
            
            user_email = d.get("user_email", "")
            user_doc = users_collection.find_one({"email": user_email}) if users_collection is not None and user_email else None
            user_name = user_doc.get("name", user_email.split("@")[0].capitalize()) if user_doc else user_email.split("@")[0].capitalize()
            user_score = user_doc.get("driving_score", 100) if user_doc else 100

            email_prefix = d.get("user_email", "").split("@")[0]
            if email_prefix.isdigit():
                s_id = email_prefix
                o_name = d.get("name") or d.get("owner") or f"Student {email_prefix}"
            else:
                s_id = d.get("student_id") or f"STU-{email_prefix[:4].upper()}"
                o_name = d.get("name") or d.get("owner") or email_prefix.capitalize()

            vehicles.append({
                "plate": p_str,
                "province": prov_str,
                "vehicle_type": v_type,
                "brand": brand,
                "model": model,
                "color": color,
                "vehicle": full_detail,
                "owner": o_name,
                "ownerEmail": d.get("user_email", ""),
                "id": s_id,
                "role": d.get("role", "Student").capitalize(),
                "score": user_score
            })
            
    if users_collection is not None:
        u_docs = list(users_collection.find({}, {"_id": 0}))
        for u in u_docs:
            u_score = u.get("driving_score", 100)
            u_name = u.get("name", u.get("email", "").split("@")[0])
            u_email = u.get("email", "")
            for v in u.get("vehicles", []):
                p_str, prov_str = clean_plate_and_province(v.get("plate", ""), v.get("province", "กรุงเทพมหานคร"))
                raw_type = v.get("type", "motorcycle")
                brand = v.get("brand", "")
                model = v.get("model", "")
                color = v.get("color", "")
                combined = f"{raw_type} {brand} {model}".lower()
                v_type = "car" if (raw_type == "car" or any(kw in combined for kw in CAR_KEYWORDS)) else "motorcycle"
                full_detail = format_vehicle_detail(v_type, brand, model, color)

                # Avoid duplicate plates
                if not any(veh["plate"] == p_str for veh in vehicles):
                    vehicles.append({
                        "plate": p_str,
                        "province": prov_str,
                        "vehicle_type": v_type,
                        "brand": brand,
                        "model": model,
                        "color": color,
                        "vehicle": full_detail,
                        "owner": u_name,
                        "ownerEmail": u_email,
                        "id": u.get("student_id", f"6507{len(vehicles)+1:04d}"),
                        "role": u.get("role", "Student").capitalize(),
                        "score": u_score
                    })
                    
    return vehicles

@router.put("/update-vehicle")
async def update_registered_vehicle(payload: dict):
    """
    Admin website endpoint: Update registered vehicle details in MongoDB (users_collection & registered_vehicles_collection).
    """
    old_email = payload.get("old_email", "").strip().lower()
    old_plate = payload.get("old_plate", "").strip()
    
    new_email = payload.get("user_email", old_email).strip().lower()
    new_plate = payload.get("plate", old_plate).strip()
    new_vtype = payload.get("vehicle_type", "motorcycle").strip()
    new_brand = payload.get("brand", "").strip()
    new_model = payload.get("model", "").strip()
    new_color = payload.get("color", "").strip()
    new_owner = payload.get("owner", "").strip()
    new_role = payload.get("role", "").strip().lower()
    new_province = payload.get("province", "กรุงเทพมหานคร").strip()

    from database import registered_vehicles_collection, users_collection

    if registered_vehicles_collection is not None:
        registered_vehicles_collection.update_one(
            {"plate": old_plate},
            {"$set": {
                "user_email": new_email,
                "role": new_role or "student",
                "plate": new_plate,
                "vehicle_type": new_vtype,
                "brand": new_brand,
                "model": new_model,
                "color": new_color,
                "province": new_province
            }}
        )

    if users_collection is not None:
        user_doc = users_collection.find_one({"email": old_email})
        if user_doc:
            user_vehs = user_doc.get("vehicles", [])
            updated = False
            for v in user_vehs:
                if v.get("plate") == old_plate:
                    v["plate"] = new_plate
                    v["type"] = new_vtype
                    v["brand"] = new_brand
                    v["model"] = new_model
                    v["color"] = new_color
                    v["province"] = new_province
                    updated = True
            
            update_fields = {}
            if updated:
                update_fields["vehicles"] = user_vehs
            if new_owner:
                update_fields["name"] = new_owner
            if new_role:
                update_fields["role"] = new_role
            if new_email and new_email != old_email:
                update_fields["email"] = new_email
                
            if update_fields:
                users_collection.update_one({"_id": user_doc["_id"]}, {"$set": update_fields})

    return {"status": "success", "message": "Vehicle details updated successfully"}

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
    
    total_scans = 0
    violations_count = 0
    compliant_count = 0
    
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
        "hourly_distribution": []
    }



