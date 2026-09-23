import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database import parking_spots_collection, saved_spots_collection, building_zones_collection, parking_status_collection
from routers.qr import PERMANENT_SPOTS

def update_all_spots():
    print("Updating MongoDB collections with 18 car spots (Zone A: 10, Zone B: 0, Zone C: 8)...")
    
    if parking_spots_collection is None:
        print("Warning: parking_spots_collection is None. Skipping DB update.")
        return

    # Delete any spots not in PERMANENT_SPOTS
    valid_spot_ids = set(s["spot_id"] for s in PERMANENT_SPOTS)
    del_res = parking_spots_collection.delete_many({"spot_id": {"$nin": list(valid_spot_ids)}})
    print(f"Removed {del_res.deleted_count} outdated spot(s) from 'parking_spots'.")

    updated_count = 0
    for spot in PERMANENT_SPOTS:
        res = parking_spots_collection.update_one(
            {"spot_id": spot["spot_id"]},
            {"$set": {
                "imageUrl": spot["imageUrl"],
                "imageUrls": spot["imageUrls"],
                "building": spot["building"],
                "floor": spot["floor"],
                "zone": spot["zone"],
                "pillar": spot["pillar"]
            }},
            upsert=True
        )
        if res.modified_count > 0 or res.upserted_id:
            updated_count += 1

    print(f"Successfully updated/upserted {updated_count} spots in 'parking_spots' collection.")

    # Re-initialize building_zones in MongoDB Atlas (4 Zones: Zone A 10, Zone B 0, Zone C 8, Zone D 0)
    if building_zones_collection is not None:
        building_zones_collection.delete_many({})
        new_zones = [
            {
                "id": "Zone A",
                "name": "Zone A",
                "tag": "Cars Only",
                "numericCapacity": 10,
                "total_slots": 10,
                "capacity": "10 Spots",
                "location": "",
                "pillars": "Spots A-01 - A-10",
                "description": "Floor G Automobile Deck A (Spots A-01 to A-10).",
                "imageUrl": "/static/zone_a_building.jpg"
            },
            {
                "id": "Zone B",
                "name": "Zone B",
                "tag": "Motorcycle Only",
                "numericCapacity": 0,
                "total_slots": 0,
                "capacity": "1 Spot",
                "location": "",
                "pillars": "Spot B-01",
                "description": "Floor G Automobile Deck B (Spot B-01).",
                "imageUrl": "/static/zone_b_building.jpg"
            },
            {
                "id": "Zone C",
                "name": "Zone C",
                "tag": "Cars Only",
                "numericCapacity": 8,
                "total_slots": 8,
                "capacity": "8 Spots",
                "location": "",
                "pillars": "Spots C-01 - C-08",
                "description": "Floor G Automobile Deck C (Spots C-01 to C-08).",
                "imageUrl": "/static/zone_c_building.jpg"
            },
            {
                "id": "Zone D",
                "name": "Zone D",
                "tag": "Motorcycle Only",
                "numericCapacity": 0,
                "total_slots": 0,
                "capacity": "1 Spot",
                "location": "",
                "pillars": "Spot D-01",
                "description": "Floor G Motorcycle Deck D (Spot D-01).",
                "imageUrl": "/static/zone_d_building.jpg"
            }
        ]
        building_zones_collection.insert_many(new_zones)
        print("Successfully synchronized 'building_zones' collection with 4 building zones.")

    # Re-initialize parking_status in MongoDB Atlas (4 Zones)
    if parking_status_collection is not None:
        parking_status_collection.delete_many({})
        new_status = [
            {"zone": "Zone A • Floor G (VMES Building)", "zone_id": "Zone A", "total_slots": 10, "available_slots": 10, "capacity": "10 Spots", "pillars": "Spots A-01 - A-10"},
            {"zone": "Zone B • Floor G (VMES Building)", "zone_id": "Zone B", "total_slots": 0, "available_slots": 0, "capacity": "1 Spot", "pillars": "Spot B-01"},
            {"zone": "Zone C • Floor G (VMES Building)", "zone_id": "Zone C", "total_slots": 8, "available_slots": 8, "capacity": "8 Spots", "pillars": "Spots C-01 - C-08"},
            {"zone": "Zone D • Floor G (VMES Building)", "zone_id": "Zone D", "total_slots": 0, "available_slots": 0, "capacity": "1 Spot", "pillars": "Spot D-01"}
        ]
        parking_status_collection.insert_many(new_status)
        print("Successfully synchronized 'parking_status' collection with 4 building zones.")

if __name__ == "__main__":
    update_all_spots()
