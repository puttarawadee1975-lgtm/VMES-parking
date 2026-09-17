import sys
import os
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import parking_status_collection, db

ZONES_DATA = [
    {
        "zone_id": "Zone A",
        "zone": "Zone A • Floor G (VMES Building)",
        "building": "VMES Building",
        "floor": "Floor G",
        "tag": "Cars Only",
        "location": "Floor G - Automobile Deck A",
        "pillars": "Spots A-01 - A-10",
        "total_slots": 10,
        "occupied_slots": 2,
        "available_slots": 8,
        "capacity": "10 Car Spots",
        "last_updated": datetime.now(timezone.utc)
    },
    {
        "zone_id": "Zone B",
        "zone": "Zone B • Floor G (VMES Building)",
        "building": "VMES Building",
        "floor": "Floor G",
        "tag": "Motorcycles",
        "location": "Floor G - Motorcycle Deck B",
        "pillars": "Spots B-01, B-02 (2 Sides)",
        "total_slots": 2,
        "occupied_slots": 1,
        "available_slots": 1,
        "capacity": "2 Motorcycle Sides",
        "last_updated": datetime.now(timezone.utc)
    },
    {
        "zone_id": "Zone C",
        "zone": "Zone C • Floor G (VMES Building)",
        "building": "VMES Building",
        "floor": "Floor G",
        "tag": "Cars Only",
        "location": "Floor G - Automobile Deck C",
        "pillars": "Spots C-01 - C-09",
        "total_slots": 9,
        "occupied_slots": 3,
        "available_slots": 6,
        "capacity": "9 Car Spots",
        "last_updated": datetime.now(timezone.utc)
    },
    {
        "zone_id": "Zone D",
        "zone": "Zone D • Floor G (VMES Building)",
        "building": "VMES Building",
        "floor": "Floor G",
        "tag": "Motorcycles",
        "location": "Floor G - Motorcycle Deck D",
        "pillars": "Spot D-01",
        "total_slots": 1,
        "occupied_slots": 1,
        "available_slots": 0,
        "capacity": "1 Motorcycle Spot",
        "last_updated": datetime.now(timezone.utc)
    }
]

def seed_parking_zones():
    if parking_status_collection is None:
        print("[SEED ERROR] Database connection not available!", file=sys.stderr)
        return

    print("[SEED] Cleaning up old parking status collection records...")
    parking_status_collection.delete_many({})

    print("[SEED] Inserting 4 updated VMES Building parking zones...")
    parking_status_collection.insert_many(ZONES_DATA)
    print(f"[SEED SUCCESS] Seeded {len(ZONES_DATA)} parking zones to MongoDB Atlas successfully!")

if __name__ == "__main__":
    seed_parking_zones()
