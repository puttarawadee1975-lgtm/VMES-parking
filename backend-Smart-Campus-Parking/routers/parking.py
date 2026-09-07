from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from database import parking_status_collection
from schemas import ParkingStatusResponse, ParkingStatusUpdate
from auth import require_roles

router = APIRouter(prefix="/parking", tags=["Parking Status"])

# Mock default data if collection is empty (Total 18 slots across 3 zones for VEMS Building)
DEFAULT_ZONES = [
    {"zone": "Zone A • Floor G (VEMS Building)", "total_slots": 6, "occupied_slots": 2},
    {"zone": "Zone B • Floor G (VEMS Building)", "total_slots": 6, "occupied_slots": 1},
    {"zone": "Zone C • Floor G (VEMS Building)", "total_slots": 6, "occupied_slots": 3},
]

@router.get("/status", response_model=List[ParkingStatusResponse])
async def get_parking_status():
    """
    Public endpoint: Get real-time available parking slots per zone.
    """
    if parking_status_collection is None:
        # Fallback response
        now = datetime.now(timezone.utc)
        return [
            ParkingStatusResponse(
                zone=item["zone"],
                total_slots=item["total_slots"],
                occupied_slots=item["occupied_slots"],
                available_slots=max(0, item["total_slots"] - item["occupied_slots"]),
                last_updated=now
            )
            for item in DEFAULT_ZONES
        ]

    docs = list(parking_status_collection.find({}, {"_id": 0}))
    if not docs:
        # Seed initial zones
        now = datetime.now(timezone.utc)
        for item in DEFAULT_ZONES:
            doc = {
                "zone": item["zone"],
                "total_slots": item["total_slots"],
                "occupied_slots": item["occupied_slots"],
                "available_slots": max(0, item["total_slots"] - item["occupied_slots"]),
                "last_updated": now
            }
            parking_status_collection.insert_one(doc)
        docs = list(parking_status_collection.find({}, {"_id": 0}))

    return docs

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
    doc = {
        "user_email": user_email,
        "zone": data.zone,
        "building": data.building or "VEMS Building",
        "floor": data.floor or "Floor G",
        "pillar": data.pillar,
        "savedDate": data.savedDate,
        "savedTime": data.savedTime,
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
    Clear/Remove saved parking spot location from MongoDB when exiting building.
    """
    if saved_spots_collection is not None:
        saved_spots_collection.delete_one({"user_email": user_email})
    return {"message": "Parking spot cleared successfully"}

# --- Vehicle Registration MongoDB Endpoints ---
from database import registered_vehicles_collection
from schemas import VehicleRegisterCreate

@router.post("/register-vehicle")
async def register_vehicle_in_mongodb(data: VehicleRegisterCreate):
    """
    Save registered vehicle info to MongoDB (registered_vehicles collection).
    """
    now = datetime.now(timezone.utc)
    doc = {
        "user_email": data.user_email or "65070042@student.university.ac.th",
        "role": data.role or "student",
        "plate": data.plate,
        "model": data.model,
        "registered_at": now
    }
    
    if registered_vehicles_collection is not None:
        registered_vehicles_collection.update_one(
            {"user_email": doc["user_email"], "plate": data.plate},
            {"$set": doc},
            upsert=True
        )
    return {"status": "success", "message": "Vehicle registered in MongoDB", "vehicle": doc}

@router.get("/user-vehicles")
async def get_user_vehicles_from_mongodb(user_email: str = "65070042@student.university.ac.th"):
    """
    Retrieve all registered vehicles for a user from MongoDB.
    """
    if registered_vehicles_collection is not None:
        vehicles = list(registered_vehicles_collection.find({"user_email": user_email}, {"_id": 0}))
        return vehicles
    return []

@router.delete("/delete-vehicle")
async def delete_vehicle_from_mongodb(user_email: str = "65070042@student.university.ac.th", plate: str = ""):
    """
    Delete a registered vehicle for a user from MongoDB.
    """
    if registered_vehicles_collection is not None and plate:
        registered_vehicles_collection.delete_one({"user_email": user_email, "plate": plate})
        return {"status": "success", "message": f"Vehicle {plate} deleted from MongoDB"}
    return {"status": "error", "message": "Vehicle plate missing or DB unavailable"}

