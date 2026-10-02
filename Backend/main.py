import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
try:
    from database import is_db_connected
except ImportError:
    def is_db_connected(): return False

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from cameras import router as cameras_router
    app.include_router(cameras_router)
    print("[Cameras] Cameras router mounted successfully.")
except Exception as e:
    print(f"[Cameras Warning] Could not mount cameras router: {e}")

try:
    from detection import router as detection_router
    app.include_router(detection_router)
    print("[Detection] AI Detection router mounted successfully.")
except Exception as e:
    print(f"[Detection Warning] Could not mount detection router: {e}")

try:
    from qr import router as qr_router
    app.include_router(qr_router)
    print("[QR Spots] QR Parking Spot router mounted successfully.")
except Exception as e:
    print(f"[QR Spots Warning] Could not mount QR router: {e}")

# Static file serving for snapshots images
from fastapi.staticfiles import StaticFiles
snapshots_dir = os.path.join(os.path.dirname(__file__), "data", "snapshots")
os.makedirs(snapshots_dir, exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")

# In-Memory Saved Spot Registry & Endpoints
saved_spots_memory = []

@app.post("/parking/save-spot")
@app.post("/api/parking/save-spot")
def save_parking_spot(payload: dict):
    user_email = payload.get("user_email") or payload.get("email") or "65070042@student.university.ac.th"
    spot_id = payload.get("spot_id") or "VMES-G-ZONEA-A01"
    zone = payload.get("zone") or "Zone A"
    pillar = payload.get("pillar") or payload.get("spot") or "Spot A-01"
    floor = payload.get("floor") or "Floor G"
    building = payload.get("building") or "VMES Building"

    spot_record = {
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

    global saved_spots_memory
    saved_spots_memory = [s for s in saved_spots_memory if s.get("user_email") != user_email]
    saved_spots_memory.append(spot_record)

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

@app.get("/parking/my-spot")
@app.get("/api/parking/my-spot")
@app.get("/parking/get-spot")
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

    for spot in saved_spots_memory:
        if spot.get("user_email") == user_email:
            return {"status": "success", "has_spot": True, "spot": spot}
    return {"status": "success", "has_spot": False, "spot": None}

@app.delete("/parking/clear-spot")
@app.delete("/parking/delete-spot")
def clear_parking_spot(user_email: str = "65070042@student.university.ac.th"):
    global saved_spots_memory
    saved_spots_memory = [s for s in saved_spots_memory if s.get("user_email") != user_email]
    if is_db_connected():
        try:
            from database import user_saved_spots_collection
            if user_saved_spots_collection is not None:
                user_saved_spots_collection.delete_one({"user_email": user_email})
        except Exception as e:
            print(f"[Database Warning] Could not clear saved spot from DB: {e}")
    return {"status": "success", "message": "Saved spot cleared successfully"}

@app.post("/auth/microsoft")
def auth_microsoft(payload: dict):
    email = payload.get("email") or "65070042@student.university.ac.th"
    name = payload.get("name") or "Student User"
    return {
        "status": "success",
        "access_token": "mock-jwt-token-safe-ride-2026",
        "user": {
            "email": email,
            "name": name,
            "role": "Student",
            "studentId": "65070042",
            "driving_score": 100
        }
    }




# Mock data
enforcement_status = { 
    "enabled": True
}

@app.get("/")
def home():
    return {
        "message": "SafeRide Backend API is running",
        "database_status": "Connected" if is_db_connected() else "Not Connected (Prepared for future DB connection)"
    }


@app.get("/admin/enforcement-status")
def get_enforcement_status():
    return enforcement_status

@app.put("/admin/enforcement-status")
def update_enforcement_status(enabled: bool):
    enforcement_status["enabled"] = enabled
    return {
        "message": "Enforcement status updated",
        "enabled": enforcement_status["enabled"]
    }

@app.get("/admin/dashboard")
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

@app.get("/admin/gate-history")
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
                "studentId": "GUEST",
                "image_url": "/snapshots/entry_cam01_1789715495_ก1687.jpg"
            }
        ]
    }

registered_vehicles = [
    {
        "id": 1,
        "plate": "ก-1687",
        "license_plate": "ก-1687",
        "vehicle_type": "car",
        "brand": "Toyota",
        "model": "Toyota Yaris",
        "color": "Silver",
        "owner": "Guest Driver",
        "user_email": "guest@student.ac.th",
        "role": "Guest",
        "studentId": "GUEST",
        "score": 50,
        "status": "Active",
        "registered_at": "2026-09-18T07:11:35.797Z",
        "vehicle_photo": "/snapshots/entry_cam01_1789715495_ก1687.jpg"
    },
    {
        "id": 2,
        "plate": "1กข 1234",
        "license_plate": "1กข 1234",
        "vehicle_type": "car",
        "brand": "Honda",
        "model": "Honda City",
        "color": "Black",
        "owner": "John Smith",
        "user_email": "john@student.ac.th",
        "role": "Student",
        "studentId": "6612345",
        "score": 51,
        "status": "Active",
        "registered_at": "2026-09-20T09:30:00Z",
        "vehicle_photo": None
    },
    {
        "id": 3,
        "plate": "3กฮ 5678",
        "license_plate": "3กฮ 5678",
        "vehicle_type": "motorcycle",
        "brand": "Yamaha",
        "model": "Yamaha NMAX 155",
        "color": "Red",
        "owner": "Somchai Jaidee",
        "user_email": "somchai@student.university.ac.th",
        "role": "Student",
        "studentId": "65070042",
        "score": 100,
        "status": "Active",
        "registered_at": "2026-09-21T11:15:00Z",
        "vehicle_photo": None
    },
    {
        "id": 4,
        "plate": "2ขค 9999",
        "license_plate": "2ขค 9999",
        "vehicle_type": "motorcycle",
        "brand": "Honda",
        "model": "Honda Wave 110i",
        "color": "Blue",
        "owner": "Somsri Rakdeeying",
        "user_email": "somsri@university.ac.th",
        "role": "Staff",
        "studentId": "STAFF-012",
        "score": 95,
        "status": "Active",
        "registered_at": "2026-09-22T14:20:00Z",
        "vehicle_photo": None
    },
    {
        "id": 5,
        "plate": "ขก 888",
        "license_plate": "ขก 888",
        "vehicle_type": "car",
        "brand": "Mazda",
        "model": "Mazda 3",
        "color": "White",
        "owner": "Prof. Anan Suksan",
        "user_email": "anan@university.ac.th",
        "role": "Faculty",
        "studentId": "PROF-005",
        "score": 90,
        "status": "Active",
        "registered_at": "2026-09-23T08:45:00Z",
        "vehicle_photo": None
    }
]

@app.get("/admin/all-vehicles")
@app.get("/admin/vehicle-directory")
@app.get("/admin/driving-score")
@app.get("/admin/users")
def get_all_registered_vehicles():
    return registered_vehicles

@app.get("/parking/user-vehicles")
def get_user_vehicles(user_email: str = ""):
    if not user_email:
        return registered_vehicles
    user_list = [v for v in registered_vehicles if v.get("user_email") == user_email]
    return user_list if user_list else registered_vehicles[:2]

@app.get("/officer/detections")
def get_officer_detections(violation_only: bool = False):
    history_data = get_gate_history()
    items = history_data.get("history", [])
    if violation_only:
        items = [i for i in items if i.get("violation")]
    return items

score_logs_list = [
    {
        "id": "LOG-001",
        "user_email": "somchai@student.university.ac.th",
        "points_changed": -10,
        "reason": "No helmet detected at Gate 1",
        "gate_name": "Gate 1 (Main Entrance)",
        "timestamp": "2026-09-24T14:30:00.000Z"
    }
]

@app.get("/admin/score-logs")
def get_score_logs():
    return score_logs_list

user_notifications = [
    {
        "id": "NOTIF-001",
        "title": "Welcome to SafeRide Smart Campus Parking",
        "message": "Your vehicle registration and parking pass are active.",
        "date": "2026-09-26",
        "read": False
    },
    {
        "id": "NOTIF-002",
        "title": "Parking Spot Saved",
        "message": "Spot A-01 (Zone A) saved successfully.",
        "date": "2026-09-26",
        "read": True
    }
]

@app.get("/notifications")
def get_user_notifications_endpoint(email: str = "u6814509@au.edu"):
    return user_notifications

@app.post("/parking/register-vehicle")
@app.post("/admin/vehicle-register")
def register_vehicle(payload: dict):
    email = payload.get("user_email") or payload.get("email") or ""
    role = (payload.get("role") or "Student").lower()
    plate = payload.get("plate") or payload.get("license_plate") or "Unregistered"

    # 1. Enforce 1 vehicle per account limit (Students/Users)
    if email and role != "admin":
        existing_user_vehicles = [v for v in registered_vehicles if v.get("user_email") == email]
        if len(existing_user_vehicles) >= 1:
            raise HTTPException(
                status_code=400, 
                detail="Registration Limit Reached: 1 vehicle is allowed per account."
            )

    # 2. Enforce 1 license plate per system account rule
    norm_plate = plate.strip().upper()
    for v in registered_vehicles:
        existing_plate = (v.get("plate") or v.get("license_plate") or "").strip().upper()
        if existing_plate and existing_plate == norm_plate:
            raise HTTPException(
                status_code=400,
                detail=f"License plate '{plate}' is already registered in the system."
            )

    new_id = len(registered_vehicles) + 1
    v_type = payload.get("vehicle_type") or "car"
    brand = payload.get("brand") or ""
    model = payload.get("model") or f"{brand} Vehicle".strip()
    color = payload.get("color") or ""
    owner = payload.get("owner") or "Registered Driver"
    
    new_vehicle = {
        "id": new_id,
        "plate": plate,
        "license_plate": plate,
        "vehicle_type": v_type,
        "brand": brand,
        "model": model,
        "color": color,
        "owner": owner,
        "user_email": email,
        "role": payload.get("role") or "Student",
        "studentId": f"6607{new_id:04d}",
        "score": 100,
        "status": "Active",
        "registered_at": "2026-09-25T23:00:00.000Z",
        "vehicle_photo": payload.get("vehicle_photo") or None
    }
    registered_vehicles.append(new_vehicle)

    # Database sync if connected
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

@app.put("/admin/update-vehicle")
def update_vehicle(payload: dict):
    target_plate = payload.get("old_plate") or payload.get("plate")
    updated_obj = None
    for v in registered_vehicles:
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

@app.delete("/parking/delete-vehicle")
def delete_vehicle(user_email: str = "", plate: str = ""):
    global registered_vehicles
    registered_vehicles = [
        v for v in registered_vehicles 
        if not (v.get("plate") == plate or v.get("license_plate") == plate or v.get("user_email") == user_email)
    ]

    if is_db_connected():
        try:
            print(f"[Database Sync] Vehicle deleted: {plate or user_email}")
        except Exception as e:
            print(f"[Database Warning] Could not sync vehicle delete to DB: {e}")

    return {"status": "success", "message": f"Vehicle {plate} deleted successfully"}

@app.post("/admin/adjust-score")
def adjust_score(payload: dict):
    email = payload.get("user_email") or ""
    change = payload.get("points_changed") or 0
    owner_name = payload.get("owner") or ""

    updated_vehicle = None
    # 1. Update in-memory vehicle score
    for v in registered_vehicles:
        if (email and v.get("user_email") == email) or (owner_name and (v.get("owner") == owner_name or v.get("plate") == owner_name)):
            cur = v.get("score", 100)
            v["score"] = max(0, min(100, cur + change))
            updated_vehicle = v
            break

    # Fallback to first vehicle if specific vehicle not found
    if not updated_vehicle and registered_vehicles and change != 0:
        registered_vehicles[0]["score"] = max(0, min(100, registered_vehicles[0].get("score", 100) + change))
        updated_vehicle = registered_vehicles[0]

    # 2. If a Database is connected, automatically sync score update to DB
    if is_db_connected():
        try:
            # Automatic Database Sync Placeholder
            # e.g., db.query(Vehicle).filter(...).update({"score": updated_vehicle["score"]})
            print(f"[Database Sync] Score adjusted for {email or owner_name}: {change} pts")
        except Exception as e:
            print(f"[Database Warning] Could not sync score to DB: {e}")

    return {"status": "success", "message": "Score updated successfully", "vehicle": updated_vehicle}

@app.post("/admin/reset-semester-scores")
def reset_semester_scores(payload: dict = {}):
    term_name = payload.get("semester_name") or "Current Academic Semester"
    
    # 1. Reset in-memory scores to 100
    for v in registered_vehicles:
        v["score"] = 100

    # 2. If a Database is connected, automatically sync reset to DB
    if is_db_connected():
        try:
            print(f"[Database Sync] All driver safety scores reset to 100 for {term_name}")
        except Exception as e:
            print(f"[Database Warning] Could not sync semester reset to DB: {e}")

    return {"status": "success", "message": f"All driver safety scores reset to 100 successfully for {term_name}!"}

# Official Campus Announcements Management
announcements_list = [
    {
        "id": "NOTICE-001",
        "title": "Semester 1 Parking Enforcement Notice",
        "content": "All vehicles entering campus must be registered and display valid parking permits. Helmet enforcement is active at all gate entry points.",
        "priority": "high",
        "date": "2026-09-20",
        "expire_date": "2026-10-30",
        "target_audience": "all",
        "created_at": "2026-09-20T08:00:00.000Z"
    },
    {
        "id": "NOTICE-002",
        "title": "Zone A Maintenance Scheduled for Weekend",
        "content": "Zone A automobile deck will undergo routine line painting and sensor maintenance on Saturday from 08:00 to 12:00.",
        "priority": "normal",
        "date": "2026-09-24",
        "expire_date": "2026-10-15",
        "target_audience": "all",
        "created_at": "2026-09-24T10:30:00.000Z"
    }
]

@app.get("/admin/announcements")
def get_announcements():
    return announcements_list

@app.post("/admin/announcements")
def create_announcement(payload: dict):
    new_id = f"NOTICE-{len(announcements_list) + 1:03d}"
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
    announcements_list.insert(0, new_item)

    if is_db_connected():
        try:
            print(f"[Database Sync] Announcement created: {new_id}")
        except Exception as e:
            print(f"[Database Warning] Could not sync announcement to DB: {e}")

    return {"status": "success", "message": "Announcement created successfully", "announcement": new_item}

@app.put("/admin/announcements/{announcement_id}")
def update_announcement(announcement_id: str, payload: dict):
    for item in announcements_list:
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

@app.delete("/admin/announcements/{announcement_id}")
def delete_announcement(announcement_id: str):
    global announcements_list
    announcements_list = [a for a in announcements_list if str(a.get("id")) != str(announcement_id)]

    if is_db_connected():
        try:
            print(f"[Database Sync] Announcement deleted: {announcement_id}")
        except Exception as e:
            print(f"[Database Warning] Could not sync announcement deletion to DB: {e}")

    return {"status": "success", "message": f"Announcement {announcement_id} removed successfully"}

# Parking Occupancy & Zones Management
building_zones_list = [
    { "id": "Zone A", "name": "Zone A", "tag": "Cars Only", "numericCapacity": 10, "total_slots": 10, "capacity": "10 Spots", "location": "Floor G Automobile Deck A", "pillars": "Spots A-01 - A-10" },
    { "id": "Zone B", "name": "Zone B", "tag": "Motorcycle Only", "numericCapacity": 0, "total_slots": 0, "capacity": "1 Spot", "location": "Floor G Automobile Deck B", "pillars": "Spot B-01" },
    { "id": "Zone C", "name": "Zone C", "tag": "Cars Only", "numericCapacity": 8, "total_slots": 8, "capacity": "8 Spots", "location": "Floor G Automobile Deck C", "pillars": "Spots C-01 - C-08" },
    { "id": "Zone D", "name": "Zone D", "tag": "Motorcycle Only", "numericCapacity": 0, "total_slots": 0, "capacity": "1 Spot", "location": "Floor G Motorcycle Deck D", "pillars": "Spot D-01" }
]

parking_status_memory = [
    {
        "zone": "Zone A",
        "name": "Zone A",
        "total_slots": 10,
        "occupied_slots": 2,
        "available_slots": 8
    },
    {
        "zone": "Zone B",
        "name": "Zone B",
        "total_slots": 0,
        "occupied_slots": 4,
        "available_slots": 0
    },
    {
        "zone": "Zone C",
        "name": "Zone C",
        "total_slots": 8,
        "occupied_slots": 1,
        "available_slots": 7
    },
    {
        "zone": "Zone D",
        "name": "Zone D",
        "total_slots": 0,
        "occupied_slots": 2,
        "available_slots": 0
    }
]

def update_in_memory_parking_status(zone_name: str, gate_type: str):
    global parking_status_memory
    for z in parking_status_memory:
        if z["zone"].lower() == zone_name.lower():
            tot = z.get("total_slots", 10)
            occ = z.get("occupied_slots", 0)
            if gate_type == "ENTRY":
                occ = min(tot, occ + 1)
            elif gate_type == "EXIT":
                occ = max(0, occ - 1)
            z["occupied_slots"] = occ
            z["available_slots"] = max(0, tot - occ)
            break

@app.get("/parking/status")
def get_parking_status():
    return parking_status_memory

@app.get("/parking/occupied-spots")
def get_occupied_spots(term: str = "2026-1"):
    return []

@app.get("/parking/building-zones")
def get_building_zones():
    return building_zones_list

@app.post("/parking/building-zones")
def update_building_zones(new_zones: list):
    global building_zones_list
    building_zones_list = new_zones
    return {"status": "success", "zones": building_zones_list}



    