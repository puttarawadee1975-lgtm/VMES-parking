from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from database import parking_status_collection, saved_spots_collection, detection_logs_collection, registered_vehicles_collection, users_collection, building_zones_collection
from schemas import ParkingStatusResponse, ParkingStatusUpdate, SpotReservationCreate
from auth import require_roles

router = APIRouter(prefix="/parking", tags=["Parking Status"])

@router.get("/status", response_model=List[ParkingStatusResponse])
async def get_parking_status():
    """
    Public endpoint: Get real-time available parking slots per zone.
    Fully synchronized with building_zones capacity and active saved_spots in MongoDB Atlas.
    """
    now = datetime.now(timezone.utc)

    # 1. Fetch building zones capacity map from MongoDB Atlas if available
    zone_capacities = {}
    if building_zones_collection is not None:
        bz_list = list(building_zones_collection.find({}, {"_id": 0}))
        for bz in bz_list:
            bz_id = bz.get("id") or bz.get("name")
            if bz_id and "numericCapacity" in bz:
                zone_capacities[bz_id] = bz["numericCapacity"]

    # 2. Count active saved spots per zone from MongoDB Atlas (status == "Active Parked")
    active_saved_counts = {}

    def normalize_zone_key(z_str: str) -> str:
        if not z_str:
            return "Zone A"
        z_u = z_str.upper()
        if "ZONE A" in z_u:
            return "Zone A"
        if "ZONE B" in z_u:
            return "Zone B"
        if "ZONE C" in z_u:
            return "Zone C"
        if "ZONE D" in z_u:
            return "Zone D"
        return z_str.split(" • ")[0].split(" (")[0].strip()

    if saved_spots_collection is not None:
        active_spots = list(saved_spots_collection.find({"status": "Active Parked"}, {"_id": 0, "zone": 1}))
        for sp in active_spots:
            z_val = (sp.get("zone") or "").strip()
            z_key = normalize_zone_key(z_val)
            if z_key:
                active_saved_counts[z_key] = active_saved_counts.get(z_key, 0) + 1
            if sp.get("plate") and sp.get("plate") != "-":
                seen_plates.add(sp.get("plate"))

    if detection_logs_collection is not None:
        logs = list(detection_logs_collection.find({}, {"_id": 0, "image_url": 0, "snapshot_base64": 0}).sort("timestamp", -1).limit(200))
        for l in logs:
            plate = l.get("plate") or l.get("license_plate") or "-"
            gate = str(l.get("gate_type") or l.get("gate") or "").lower()
            vtype = str(l.get("vehicle_type") or l.get("vehicleType") or "").lower()
            if "exit" in gate:
                continue
            if vtype == "car" or "car" in vtype:
                if plate != "-" and plate in seen_plates:
                    continue
                if plate != "-":
                    seen_plates.add(plate)
                z_assigned = l.get("zone") or ""
                z_key = normalize_zone_key(z_assigned)
                active_saved_counts[z_key] = active_saved_counts.get(z_key, 0) + 1

    DEFAULT_BUILDING_ZONES = [
        {"zone": "Zone A • Floor G (VMES Building)", "total_slots": 10},
        {"zone": "Zone B • Floor G (VMES Building)", "total_slots": 1},
        {"zone": "Zone C • Floor G (VMES Building)", "total_slots": 8},
    ]

    docs = list(parking_status_collection.find({}, {"_id": 0})) if parking_status_collection is not None else []
    if not docs:
        docs = DEFAULT_BUILDING_ZONES

    res = []
    for doc in docs:
        z_key = normalize_zone_key(doc.get("zone", ""))
        new_total = zone_capacities.get(z_key, doc.get("total_slots", 0))
        # Ensure default capacity fallback if 0
        if new_total == 0:
            if z_key == "Zone A": new_total = 10
            elif z_key == "Zone B": new_total = 1
            elif z_key == "Zone C": new_total = 8
            else: new_total = 10

        new_occupied = active_saved_counts.get(z_key, 0)
        new_available = max(0, new_total - new_occupied)

        res.append(
            ParkingStatusResponse(
                zone=doc.get("zone", "Zone"),
                total_slots=new_total,
                occupied_slots=new_occupied,
                available_slots=new_available,
                last_updated=now
            )
        )

        if parking_status_collection is not None and "zone" in doc:
            parking_status_collection.update_one(
                {"zone": doc["zone"]},
                {"$set": {
                    "total_slots": new_total,
                    "occupied_slots": new_occupied,
                    "available_slots": new_available,
                    "last_updated": now
                }},
                upsert=True
            )
    return res

@router.post("/update", response_model=ParkingStatusResponse)
async def update_parking_zone(
    data: ParkingStatusUpdate,
    current_user: dict = Depends(require_roles(["officer", "office"]))
):
    """
    Update total and occupied slots for a specific zone (Officer / Office only).
    """
    if parking_status_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    now = datetime.now(timezone.utc)
    avail = max(0, data.total_slots - data.occupied_slots)
    update_data = {
        "zone": data.zone,
        "total_slots": data.total_slots,
        "occupied_slots": data.occupied_slots,
        "available_slots": avail,
        "last_updated": now
    }

    parking_status_collection.update_one(
        {"zone": data.zone},
        {"$set": update_data},
        upsert=True
    )
    return update_data

# --- Saved Spots MongoDB Endpoints ---
from database import saved_spots_collection
from schemas import SavedSpotCreate, SavedSpotResponse

@router.post("/save-spot", response_model=SavedSpotResponse)
async def save_user_parking_spot(data: SavedSpotCreate, user_email: str = "demo@student.ac.th"):
    """
    Save or update user's parked spot location in MongoDB.
    """
    now = datetime.now(timezone.utc)

    owner_name = "Registered Driver"
    plate_num = "-"
    role_str = "Student"
    province_str = "-"
    v_type = "car"

    if users_collection is not None:
        user_doc = users_collection.find_one({"email": user_email.strip().lower()}, {"_id": 0})
        if user_doc:
            owner_name = user_doc.get("name", owner_name)
            role_str = user_doc.get("role", role_str)
            if user_doc.get("vehicles"):
                first_v = user_doc["vehicles"][0]
                plate_num = first_v.get("plate", plate_num)
                province_str = first_v.get("province", province_str)
                v_type = first_v.get("vehicle_type", v_type)

    if registered_vehicles_collection is not None and plate_num == "-":
        rv_doc = registered_vehicles_collection.find_one({"user_email": user_email}, {"_id": 0})
        if rv_doc:
            plate_num = rv_doc.get("plate", plate_num)
            role_str = rv_doc.get("role", role_str)

    from database import parking_spots_collection
    image_url_val = data.imageUrl
    image_urls_val = data.imageUrls

    if parking_spots_collection is not None:
        spot_db = parking_spots_collection.find_one(
            {"$or": [{"spot_id": data.pillar}, {"zone": data.zone, "pillar": data.pillar}]},
            {"_id": 0}
        )
        if spot_db:
            image_url_val = spot_db.get("imageUrl") or image_url_val
            image_urls_val = spot_db.get("imageUrls") or image_urls_val

    if not image_url_val and (data.zone == "Zone D" or "D-01" in (data.pillar or "")):
        image_url_val = "/static/zone_d_building.jpg,/static/zone_d_spot.jpg"
        image_urls_val = [
            "/static/zone_d_building.jpg",
            "/static/zone_d_spot.jpg"
        ]

    doc = {
        "user_email": user_email,
        "owner": owner_name,
        "studentId": user_email.split("@")[0].upper() if "@" in user_email else "STUDENT",
        "role": role_str,
        "plate": plate_num,
        "province": province_str,
        "vehicleType": v_type,
        "zone": data.zone,
        "building": data.building or "VMES Building",
        "floor": data.floor or "Floor G",
        "pillar": data.pillar,
        "imageUrl": image_url_val,
        "imageUrls": image_urls_val,
        "savedDate": data.savedDate or now.strftime("%Y-%m-%d"),
        "savedTime": data.savedTime or now.strftime("%I:%M %p"),
        "status": "Active Parked",
        "term": "2026-1",
        "timestamp": now
    }

    if saved_spots_collection is not None:
        saved_spots_collection.update_one(
            {"user_email": user_email},
            {"$set": doc},
            upsert=True
        )
    return doc

@router.get("/get-spot", response_model=SavedSpotResponse)
async def get_user_parking_spot(user_email: str = "demo@student.ac.th"):
    """
    Retrieve saved parking spot location from MongoDB.
    """
    if saved_spots_collection is not None:
        doc = saved_spots_collection.find_one({"user_email": user_email}, {"_id": 0})
        if doc:
            return doc

    raise HTTPException(status_code=404, detail="No saved parking spot found for user")

@router.delete("/clear-spot")
async def clear_user_parking_spot(user_email: str = "demo@student.ac.th"):
    """
    Mark saved parking spot status as Exited in MongoDB (Permanent Data Retention Policy).
    """
    now = datetime.now(timezone.utc)
    time_str = now.strftime("%I:%M %p")
    if saved_spots_collection is not None:
        saved_spots_collection.update_many(
            {"user_email": user_email},
            {"$set": {
                "status": "Exited",
                "exitTime": f"{time_str} (Gate 2 Exit)",
                "exit_timestamp": now
            }}
        )
    return {"message": "Parking spot status updated to Exited (Retained in MongoDB)"}


@router.post("/reserve-spot")
async def reserve_parking_spot(data: SpotReservationCreate):
    """
    Reserve a parking spot for a user for a duration of time.
    """
    now = datetime.now(timezone.utc)
    locked_until = now + timedelta(minutes=data.durationMinutes)
    doc = {
        "user_email": data.user_email,
        "zone": data.zone,
        "building": data.building or "VMES Building",
        "floor": data.floor or "Floor G",
        "pillar": data.pillar,
        "duration_minutes": data.durationMinutes,
        "reserved_at": now.isoformat(),
        "locked_until": locked_until.isoformat(),
        "plate": data.plate,
        "status": "Reserved",
        "term": "2026-1"
    }

    if saved_spots_collection is not None:
        saved_spots_collection.update_one(
            {"user_email": data.user_email},
            {"$set": doc},
            upsert=True
        )
    return doc

@router.get("/reservations")
async def get_all_spot_reservations():
    """
    Public / Admin endpoint: Get active reserved parking spots.
    """
    if saved_spots_collection is not None:
        results = list(saved_spots_collection.find({"$or": [{"status": "Reserved"}, {"status": "Reserved & Locked"}]}, {"_id": 0}))
        return results
    return []

@router.get("/occupied-spots")
async def get_occupied_parking_spots(term: str = "2026-1"):
    """
    Public / Admin endpoint: Get parked vehicle spots dynamically from MongoDB Atlas.
    - If user saved their parking spot (saved_spots_collection), show their specific saved floor & pillar.
    - If car entered via CCTV gate (detection_logs_collection) but did NOT save spot, display location as '-'.
    - Fully resolves User ID, Name & Role from MongoDB Atlas (Registered User vs Guest).
    """
    results = []
    seen_plates = set()
    seen_emails = set()

    # Helper function to normalize plate string for matching
    def norm_p(p: str) -> str:
        return (p or "").replace("-", "").replace(" ", "").upper()

    # 1. Fetch saved spots from MongoDB saved_spots_collection (Users who scanned & saved spot)
    if saved_spots_collection is not None:
        try:
            saved_docs = list(saved_spots_collection.find({}, {"_id": 0}))
            for item in saved_docs:
                item_term = item.get("term", "2026-1")
                if term != "ALL" and item_term != term:
                    continue
                spot_id = item.get("id") or f"SPOT-{item.get('user_email', 'anon').split('@')[0]}"
                plate_str = item.get("plate", "-")
                email_str = item.get("user_email", "")
                if plate_str != "-":
                    seen_plates.add(plate_str)
                if email_str:
                    seen_emails.add(email_str)

                # Look up registered user in users_collection for authoritative Name, Role & Student ID
                user_doc = None
                if email_str and users_collection is not None:
                    user_doc = users_collection.find_one({"email": email_str.strip().lower()})
                if not user_doc and plate_str != "-" and users_collection is not None:
                    clean_p = norm_p(plate_str)
                    for cand in users_collection.find({}):
                        leg = norm_p(cand.get("license_plate", ""))
                        if leg and leg == clean_p:
                            user_doc = cand
                            break
                        for veh in cand.get("vehicles", []):
                            vp = norm_p(veh.get("plate", ""))
                            if vp and vp == clean_p:
                                user_doc = cand
                                break
                        if user_doc:
                            break

                if user_doc:
                    owner_name = user_doc.get("name") or item.get("owner") or "Registered Driver"
                    student_id = user_doc.get("student_id") or user_doc.get("studentId") or item.get("studentId") or (email_str.split("@")[0].upper() if "@" in email_str else "STUDENT")
                    role_str = (user_doc.get("role") or item.get("role") or "Student").capitalize()
                else:
                    owner_name = item.get("owner") or item.get("name") or "Guest Driver"
                    student_id = item.get("studentId") or (email_str.split("@")[0].upper() if "@" in email_str else "GUEST")
                    role_str = (item.get("role") or "Guest").capitalize()

                saved_d = item.get("savedDate")
                if not saved_d and item.get("timestamp"):
                    ts_val = item.get("timestamp")
                    if isinstance(ts_val, datetime):
                        saved_d = ts_val.strftime("%Y-%m-%d")
                    else:
                        saved_d = str(ts_val)[:10]

                status_val = item.get("status", "Active Parked")
                if status_val == "Exited":
                    resolved_exit = item.get("exitTime") or "05:30 PM (Gate 2 Exit)"
                    if not resolved_exit.endswith(")"):
                        resolved_exit = f"{resolved_exit} (Gate 2 Exit)"
                else:
                    resolved_exit = "Active (In Building)"

                results.append({
                    "id": spot_id,
                    "owner": owner_name,
                    "studentId": student_id,
                    "ownerEmail": email_str or "guest@visitor.ac.th",
                    "role": role_str,
                    "plate": plate_str,
                    "province": item.get("province", "-") if plate_str != "-" else "-",
                    "vehicleType": item.get("vehicleType", item.get("vehicle_type", "car")),
                    "vehicleName": item.get("vehicleName", item.get("model", "Vehicle")),
                    "building": item.get("building", "VMES Building"),
                    "zone": item.get("zone", "Zone A"),
                    "floor": item.get("floor", "Floor G"),
                    "pillar": item.get("pillar", "Spot A-01"),
                    "entryTime": item.get("savedTime") or "Active Parked",
                    "exitTime": resolved_exit,
                    "scannedTime": item.get("savedTime", "Now"),
                    "rawDate": saved_d,
                    "savedDate": saved_d,
                    "timestamp": str(item.get("timestamp")) if item.get("timestamp") else None,
                    "entryGate": "Gate 1 Entry",
                    "safetyScore": item.get("safetyScore", 100),
                    "status": status_val,
                    "imageUrl": item.get("imageUrl") or "",
                    "term": item_term,
                    "isSpotSaved": True
                })
        except Exception as err:
            print(f"[OCCUPIED SPOTS FETCH ERROR - saved_spots] {err}")

    # 2. Fetch CCTV gate entry detection logs (Users who entered building but did NOT save spot)
    from database import detection_logs_collection
    if detection_logs_collection is not None:
        try:
            logs = list(detection_logs_collection.find({}, {"_id": 0, "image_url": 0, "snapshot_base64": 0}).sort("timestamp", -1).limit(100))
            for l in logs:
                l_term = l.get("term", "2026-1")
                if term != "ALL" and l_term != term:
                    continue
                gate_str = str(l.get("gate_type") or l.get("gate") or "").lower()
                if "exit" in gate_str:
                    continue

                l_plate = l.get("plate") or l.get("license_plate") or "-"
                l_email = l.get("matched_email") or l.get("ownerEmail") or ""

                if (l_plate != "-" and l_plate in seen_plates) or (l_email and l_email in seen_emails):
                    continue

                if l_plate != "-":
                    seen_plates.add(l_plate)

                # Look up registered user in users_collection / registered_vehicles_collection
                user_doc = None
                reg_v = None
                if l_email and users_collection is not None:
                    user_doc = users_collection.find_one({"email": l_email.strip().lower()})
                if not user_doc and l_plate != "-" and users_collection is not None:
                    clean_lp = norm_p(l_plate)
                    for cand in users_collection.find({}):
                        leg = norm_p(cand.get("license_plate", ""))
                        if leg and leg == clean_lp:
                            user_doc = cand
                            break
                        for veh in cand.get("vehicles", []):
                            vp = norm_p(veh.get("plate", ""))
                            if vp and vp == clean_lp:
                                user_doc = cand
                                break
                        if user_doc:
                            break
                if not user_doc and l_plate != "-" and registered_vehicles_collection is not None:
                    clean_lp = norm_p(l_plate)
                    for rv in registered_vehicles_collection.find({}):
                        vp = norm_p(rv.get("plate", ""))
                        if vp and vp == clean_lp:
                            reg_v = rv
                            if rv.get("user_email") and users_collection is not None:
                                user_doc = users_collection.find_one({"email": rv.get("user_email")})
                            break

                if user_doc:
                    owner_name = user_doc.get("name") or (user_doc.get("email", "").split("@")[0].capitalize())
                    student_id = user_doc.get("student_id") or user_doc.get("studentId") or (user_doc.get("email", "").split("@")[0].upper() if "@" in user_doc.get("email", "") else "STUDENT")
                    role_str = (user_doc.get("role") or "Student").capitalize()
                    owner_email = user_doc.get("email", "")
                elif reg_v:
                    owner_name = reg_v.get("owner") or reg_v.get("user_email", "").split("@")[0].capitalize()
                    student_id = reg_v.get("student_id") or (reg_v.get("user_email", "").split("@")[0].upper() if "@" in reg_v.get("user_email", "") else "GUEST")
                    role_str = (reg_v.get("role") or "Student").capitalize()
                    owner_email = reg_v.get("user_email", "")
                else:
                    # Unregistered Guest Vehicle
                    raw_user = l.get("matched_user")
                    owner_name = raw_user if (raw_user and "Guest" not in raw_user and "Unregistered" not in raw_user) else "Guest Driver"
                    student_id = "GUEST"
                    role_str = "Guest"
                    owner_email = "guest@visitor.ac.th"

                ts = l.get("timestamp")
                entry_time_str = "Active Parked"
                log_d = None
                if ts:
                    if isinstance(ts, datetime):
                        entry_time_str = ts.strftime("%I:%M %p")
                        log_d = ts.strftime("%Y-%m-%d")
                    else:
                        entry_time_str = str(ts)
                        log_d = str(ts)[:10]
                elif l.get("time"):
                    entry_time_str = str(l.get("time"))

                spot_id = l.get("id") or f"LOG-{l_plate}"
                results.append({
                    "id": spot_id,
                    "owner": owner_name,
                    "studentId": student_id,
                    "ownerEmail": owner_email,
                    "role": role_str,
                    "plate": l_plate,
                    "province": l.get("province", "-") if l_plate != "-" else "-",
                    "vehicleType": l.get("vehicle_type") or l.get("vehicleType", "car"),
                    "vehicleName": l.get("vehicle") or l.get("vehicleName", "Scanned Vehicle"),
                    "building": "VMES Building",
                    "zone": "-",
                    "floor": "-",
                    "pillar": "-",
                    "entryTime": entry_time_str,
                    "exitTime": "Active (In Building)",
                    "scannedTime": entry_time_str,
                    "rawDate": log_d,
                    "savedDate": log_d,
                    "timestamp": str(ts) if ts else None,
                    "entryGate": "Gate 1 Entry",
                    "safetyScore": 100,
                    "status": "Active Parked",
                    "imageUrl": l.get("photo") or l.get("cctv_image_url") or l.get("image_url") or l.get("snapshot_url") or "",
                    "term": l_term,
                    "isSpotSaved": False
                })
        except Exception as err:
            print(f"[OCCUPIED SPOTS FETCH ERROR - detection_logs] {err}")

    return results

# --- Vehicle Registration MongoDB Endpoints ---
from database import registered_vehicles_collection, users_collection
from schemas import VehicleRegisterCreate
import base64
import os

@router.post("/register-vehicle")
async def register_vehicle_in_mongodb(data: VehicleRegisterCreate):
    """
    Save registered vehicle info & 2 mandatory vehicle photos (front & side) to MongoDB.
    """
    if not data.user_email:
        raise HTTPException(status_code=400, detail="user_email is required for vehicle registration")

    import re
    if re.search(r'[a-zA-Z]', data.plate or ""):
        raise HTTPException(
            status_code=400,
            detail="License plate letters must be in Thai characters (e.g. 1กข 1234 or 3กฮ 5678)"
        )
    now = datetime.now(timezone.utc)

    def save_base64_photo(raw_photo, prefix):
        if not raw_photo:
            return None
        if raw_photo.startswith("data:image"):
            try:
                header, base64_data = raw_photo.split(",", 1)
                ext = "jpg"
                if "png" in header:
                    ext = "png"
                img_bytes = base64.b64decode(base64_data)
                safe_plate = "".join([c for c in data.plate if c.isalnum()]) or "plate"
                filename = f"{prefix}_{int(now.timestamp())}_{safe_plate}.{ext}"
                target_dir = os.path.join(os.path.dirname(__file__), "..", "data", "vehicle_photos")
                os.makedirs(target_dir, exist_ok=True)
                filepath = os.path.join(target_dir, filename)
                with open(filepath, "wb") as f:
                    f.write(img_bytes)
                return f"/vehicle_photos/{filename}"
            except Exception as err:
                print(f"[VEHICLE PHOTO ERROR] {err}")
                return raw_photo  # Preserve raw base64 URI if disk write fails
        elif raw_photo.startswith("http") or raw_photo.startswith("/"):
            return raw_photo
        return raw_photo

    front_url = data.front_photo_url or save_base64_photo(data.vehicle_front_photo or data.vehicle_photo, "front")
    side_url = data.side_photo_url or save_base64_photo(data.vehicle_side_photo, "side")
    student_id_url = save_base64_photo(data.student_id_photo, "student_id")
    if not front_url and data.vehicle_photo:
        front_url = save_base64_photo(data.vehicle_photo, "vehicle")

    # Fallback to raw base64 data if URL is missing
    front_photo_data = front_url or data.vehicle_front_photo or data.vehicle_photo
    side_photo_data = side_url or data.vehicle_side_photo
    student_id_photo_data = student_id_url or data.student_id_photo

    main_photo_url = front_photo_data or side_photo_data or data.vehicle_photo_url or data.vehicle_photo

    doc = {
        "user_email": data.user_email.strip().lower(),
        "role": data.role or "student",
        "plate": data.plate,
        "model": data.model,
        "vehicle_photo": main_photo_url,
        "vehicle_front_photo": front_photo_data,
        "vehicle_side_photo": side_photo_data,
        "student_id_photo": student_id_photo_data,
        "id_card_photo": student_id_photo_data,
        "vehicle_photo_url": main_photo_url,
        "front_photo_url": front_photo_data,
        "side_photo_url": side_photo_data,
        "student_id_photo_url": student_id_photo_data,
        "id_card_photo_url": student_id_photo_data,
        "vehicle_front_photo_base64": data.vehicle_front_photo if (data.vehicle_front_photo and data.vehicle_front_photo.startswith("data:")) else None,
        "vehicle_side_photo_base64": data.vehicle_side_photo if (data.vehicle_side_photo and data.vehicle_side_photo.startswith("data:")) else None,
        "student_id_photo_base64": data.student_id_photo if (data.student_id_photo and data.student_id_photo.startswith("data:")) else None,
        "registered_at": now
    }

    if registered_vehicles_collection is not None:
        registered_vehicles_collection.update_one(
            {"user_email": doc["user_email"], "plate": data.plate},
            {"$set": doc},
            upsert=True
        )

    if users_collection is not None:
        user_doc = users_collection.find_one({"email": data.user_email.strip().lower()})
        if user_doc:
            user_vehicles = user_doc.get("vehicles", [])
            updated_vehicles = []
            found = False
            for v in user_vehicles:
                if v.get("plate") == data.plate:
                    v["model"] = data.model
                    v["vehicle_photo"] = main_photo_url
                    v["vehicle_front_photo"] = front_photo_data
                    v["vehicle_side_photo"] = side_photo_data
                    v["student_id_photo"] = student_id_photo_data
                    v["vehicle_photo_url"] = main_photo_url
                    v["front_photo_url"] = front_photo_data
                    v["side_photo_url"] = side_photo_data
                    v["student_id_photo_url"] = student_id_photo_data
                    found = True
                updated_vehicles.append(v)
            if not found:
                updated_vehicles.append({
                    "plate": data.plate,
                    "model": data.model,
                    "vehicle_photo": main_photo_url,
                    "vehicle_front_photo": front_photo_data,
                    "vehicle_side_photo": side_photo_data,
                    "student_id_photo": student_id_photo_data,
                    "vehicle_photo_url": main_photo_url,
                    "front_photo_url": front_photo_data,
                    "side_photo_url": side_photo_data,
                    "student_id_photo_url": student_id_photo_data
                })

            user_set_fields = {
                "vehicles": updated_vehicles,
                "license_plate": data.plate
            }
            if student_id_photo_data:
                user_set_fields["student_id_photo"] = student_id_photo_data
                user_set_fields["id_card_photo"] = student_id_photo_data
                user_set_fields["student_id_photo_url"] = student_id_photo_data

            users_collection.update_one(
                {"email": data.user_email.strip().lower()},
                {"$set": user_set_fields}
            )

    return {"status": "success", "message": "Vehicle registered in MongoDB with vehicle & ID photos", "vehicle": doc}



@router.get("/user-vehicles")
async def get_user_vehicles_from_mongodb(user_email: str = ""):
    """
    Retrieve all registered vehicles for a user from MongoDB.
    """
    if not user_email:
        return []
    if registered_vehicles_collection is not None:
        vehicles = list(registered_vehicles_collection.find({"user_email": user_email}, {"_id": 0}))
        return vehicles
    return []

@router.delete("/delete-vehicle")
async def delete_vehicle_from_mongodb(user_email: str = "", plate: str = ""):
    """
    Delete a registered vehicle for a user from MongoDB.
    """
    if registered_vehicles_collection is not None and user_email and plate:
        registered_vehicles_collection.delete_one({"user_email": user_email, "plate": plate})
        return {"status": "success", "message": f"Vehicle {plate} deleted from MongoDB"}
    return {"status": "error", "message": "Vehicle plate or user_email missing or DB unavailable"}

DEFAULT_ZONES = [
    {
        "id": "Zone A",
        "name": "Zone A",
        "tag": "Cars Only",
        "type": "Car Only",
        "numericCapacity": 10,
        "total_slots": 10,
        "total": 10,
        "capacity": "10 Spots",
        "location": "VMES Building Floor G (Spot A-01 to A-10)",
        "rate": "100%",
        "slots": [f"Spot A-{i:02d}" for i in range(1, 11)]
    },
    {
        "id": "Zone B",
        "name": "Zone B",
        "tag": "Motorcycle Only",
        "type": "Motorcycle Only",
        "numericCapacity": 0,
        "total_slots": 0,
        "total": 0,
        "capacity": "1 Spot",
        "location": "VMES Building Floor G (Spot B-01)",
        "rate": "100%",
        "slots": ["Spot B-01"]
    },
    {
        "id": "Zone C",
        "name": "Zone C",
        "tag": "Cars Only",
        "type": "Car Only",
        "numericCapacity": 8,
        "total_slots": 8,
        "total": 8,
        "capacity": "8 Spots",
        "location": "VMES Building Floor G (Spot C-01 to C-08)",
        "rate": "100%",
        "slots": [f"Spot C-{i:02d}" for i in range(1, 9)]
    },
    {
        "id": "Zone D",
        "name": "Zone D",
        "tag": "Motorcycle Only",
        "type": "Motorcycle Only",
        "numericCapacity": 0,
        "total_slots": 0,
        "total": 0,
        "capacity": "1 Spot",
        "location": "VMES Building Floor G (Spot D-01)",
        "rate": "100%",
        "slots": ["Spot D-01"]
    }
]

@router.get("/building-zones")
async def get_building_zones_from_mongodb():
    """
    Retrieve dynamic building zones configuration from MongoDB Atlas.
    """
    if building_zones_collection is not None:
        zones = list(building_zones_collection.find({}, {"_id": 0}))
        if zones and len(zones) > 0:
            return zones
    return DEFAULT_ZONES

@router.post("/building-zones")
async def save_building_zones_to_mongodb(zones: list):
    """
    Save/sync building zones configuration into MongoDB Atlas.
    """
    if building_zones_collection is not None and isinstance(zones, list):
        building_zones_collection.delete_many({})
        if zones:
            building_zones_collection.insert_many(zones)
        return {"status": "success", "message": "Building zones updated in MongoDB Atlas"}
    return {"status": "error", "message": "Failed to update building zones in MongoDB Atlas"}
