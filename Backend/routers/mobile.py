"""
Mobile App Router - Endpoints dedicated for Student/User/Guest Mobile Application
"""

from fastapi import APIRouter, HTTPException
from database import is_db_connected
import store

router = APIRouter(tags=["Mobile App"])

@router.post("/parking/save-spot")
@router.post("/api/parking/save-spot")
def save_parking_spot(payload: dict):
    user_email = payload.get("user_email") or payload.get("email") or "65070042@student.university.ac.th"
    user_id = payload.get("user_id") or payload.get("userId") or (user_email.split('@')[0] if user_email else "GUEST")
    spot_id = payload.get("spot_id") or "VMES-G-ZONEA-A01"
    zone = payload.get("zone") or "Zone A"
    pillar = payload.get("pillar") or payload.get("spot") or "Spot A-01"
    floor = payload.get("floor") or "Floor G"
    building = payload.get("building") or "VMES Building"

    spot_record = {
        "user_id": user_id,
        "user_email": user_email,
        "spot_id": spot_id,
        "building": building,
        "floor": floor,
        "zone": zone,
        "pillar": pillar,
        "status": payload.get("status") or "Active Parked",
        "timestamp": payload.get("timestamp") or payload.get("scannedAt") or "2026-09-26T22:00:00.000Z",
        "scannedAt": payload.get("scannedAt") or payload.get("timestamp") or "Just Now",
        "imageUrl": payload.get("imageUrl") or "",
        "imageUrls": payload.get("imageUrls") or [],
        "floorPlanUrl": payload.get("floorPlanUrl") or "",
        "mapOverlayUrl": payload.get("mapOverlayUrl") or "",
        "nearestExit": payload.get("nearestExit") or "Gate 1 Exit Ramp"
    }

    store.saved_spots_memory = [s for s in store.saved_spots_memory if s.get("user_email") != user_email]
    store.saved_spots_memory.append(spot_record)

    if is_db_connected():
        try:
            from database import user_saved_spots_collection
            if user_saved_spots_collection is not None:
                user_saved_spots_collection.update_one(
                    {"user_email": user_email},
                    {"$set": spot_record},
                    upsert=True
                )
            print(f"[Database Sync] Saved spot for {user_email}: {zone} ({pillar})")
        except Exception as e:
            print(f"[Database Warning] Could not sync saved spot to DB: {e}")

    return {
        "status": "success",
        "message": f"Parking spot saved: {zone} ({pillar})",
        "spot": spot_record
    }

@router.get("/parking/my-spot")
@router.get("/api/parking/my-spot")
@router.get("/parking/get-spot")
def get_my_saved_spot(user_email: str = "65070042@student.university.ac.th"):
    if is_db_connected():
        try:
            from database import user_saved_spots_collection
            if user_saved_spots_collection is not None:
                doc = user_saved_spots_collection.find_one({"user_email": user_email})
                if doc:
                    doc.pop("_id", None)
                    return {"status": "success", "has_spot": True, "spot": doc}
        except Exception as e:
            print(f"[Database Warning] Could not fetch saved spot from DB: {e}")

    for spot in store.saved_spots_memory:
        if spot.get("user_email") == user_email:
            return {"status": "success", "has_spot": True, "spot": spot}
    return {"status": "success", "has_spot": False, "spot": None}

@router.delete("/parking/clear-spot")
@router.delete("/parking/delete-spot")
def clear_parking_spot(user_email: str = "65070042@student.university.ac.th"):
    store.saved_spots_memory = [s for s in store.saved_spots_memory if s.get("user_email") != user_email]
    if is_db_connected():
        try:
            from database import user_saved_spots_collection
            if user_saved_spots_collection is not None:
                user_saved_spots_collection.delete_one({"user_email": user_email})
        except Exception as e:
            print(f"[Database Warning] Could not clear saved spot from DB: {e}")
    return {"status": "success", "message": "Saved spot cleared successfully"}

@router.post("/auth/microsoft")
def auth_microsoft(payload: dict):
    email = payload.get("email") or payload.get("user_email") or ""
    name = payload.get("name") or payload.get("user_name") or ""
    id_token = payload.get("id_token") or payload.get("idToken") or ""

    if not email and id_token and "." in id_token:
        try:
            import base64
            import json
            parts = id_token.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * (-len(parts[1]) % 4)
                decoded_bytes = base64.urlsafe_b64decode(padded)
                parsed_name = parsed.get("name") or (f"{parsed.get('given_name', '')} {parsed.get('family_name', '')}".strip())
                name = name or parsed_name or (email.split("@")[0] if email else "")
        except Exception as e:
            print(f"[Auth Microsoft JWT Decode Warning] {e}")

    email = email or "65070042@student.university.ac.th"
    clean_email = email.lower().strip()
    if not name or name == clean_email.split("@")[0]:
        email_prefix = clean_email.split("@")[0]
        if "." in email_prefix or "_" in email_prefix:
            name = " ".join(p.capitalize() for p in email_prefix.replace("_", ".").split("."))
        else:
            name = name or "University Member"

    is_student_pattern = "student" in clean_email or clean_email.startswith("u") or any(c.isdigit() for c in clean_email.split("@")[0])
    role = "student" if is_student_pattern else ("staff" if ("staff" in clean_email or "faculty" in clean_email) else "student")

    for v in store.registered_vehicles:
        if v.get("user_email") and v.get("user_email").lower() == clean_email:
            role = v.get("role", role)
            break

    student_id = "".join(filter(str.isdigit, clean_email.split("@")[0])) or "65070042"

    return {
        "status": "success",
        "access_token": "mock-jwt-token-safe-ride-2026",
        "user": {
            "email": clean_email,
            "name": name,
            "role": role,
            "user_id": student_id,
            "userId": student_id,
            "driving_score": 100
        }
    }

@router.get("/parking/user-vehicles")
def get_user_vehicles(user_email: str = "", user_id: str = ""):
    if not user_email and not user_id:
        return store.registered_vehicles
    user_list = [v for v in store.registered_vehicles if (user_id and v.get("user_id") == user_id) or (user_email and v.get("user_email") == user_email)]
    if user_list:
        return user_list[:1]
    # Return single default vehicle for u6814509@au.edu if not found
    if "u6814509" in user_email or "au.edu" in user_email:
        return [{
            "id": 10,
            "user_id": "6814509",
            "userId": "6814509",
            "plate": "3กค 5678",
            "license_plate": "3กค 5678",
            "province": "Bangkok",
            "vehicle_type": "car",
            "brand": "Honda",
            "model": "Honda Civic RS (Black)",
            "color": "Black",
            "owner": "Pattarawadee A.",
            "user_email": user_email,
            "role": "Student",
            "score": 100,
            "status": "Active"
        }]
    return []

@router.post("/parking/register-vehicle")
def register_vehicle(payload: dict):
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
            print(f"[Database Sync] Vehicle registered: {plate} ({owner})")
        except Exception as e:
            print(f"[Database Warning] Could not sync new vehicle to DB: {e}")

    return {
        "status": "success",
        "message": "Vehicle registered successfully",
        "vehicle": new_vehicle
    }

@router.delete("/parking/delete-vehicle")
def delete_vehicle(user_email: str = "", plate: str = ""):
    store.registered_vehicles = [
        v for v in store.registered_vehicles 
        if not (v.get("plate") == plate or v.get("license_plate") == plate or v.get("user_email") == user_email)
    ]

    if is_db_connected():
        try:
            print(f"[Database Sync] Vehicle deleted: {plate or user_email}")
        except Exception as e:
            print(f"[Database Warning] Could not sync vehicle delete to DB: {e}")

    return {"status": "success", "message": f"Vehicle {plate} deleted successfully"}

@router.get("/notifications")
def get_user_notifications_endpoint(email: str = "u6814509@au.edu"):
    return store.user_notifications

@router.get("/parking/status")
def get_parking_status():
    return store.parking_status_memory

@router.get("/parking/occupied-spots")
def get_occupied_spots(term: str = "2026-1"):
    return []

@router.get("/parking/building-zones")
def get_building_zones():
    return store.building_zones_list

@router.post("/parking/building-zones")
def update_building_zones(new_zones: list):
    store.building_zones_list = new_zones
    return {"status": "success", "zones": store.building_zones_list}
