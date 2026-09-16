from database import (
    building_zones_collection,
    system_settings_collection,
    registered_gates_collection
)

DEFAULT_ZONES = [
    {
        "id": "Zone A",
        "name": "Zone A",
        "tag": "Cars Only",
        "badgeClass": "badge-live",
        "location": "Floor G - Automobile Deck A",
        "pillars": "Spots A-01 - A-10",
        "capacity": "10 Car Spots",
        "numericCapacity": 10,
        "isUnlimited": False,
        "imageUrl": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80",
        "description": "Automobile Deck A (A-01 to A-10).",
        "color": "#2563eb",
        "bgLight": "#eff6ff"
    },
    {
        "id": "Zone B",
        "name": "Zone B",
        "tag": "Motorcycles",
        "badgeClass": "badge-warning",
        "location": "Floor G - Motorcycle Deck B",
        "pillars": "Spots B-01, B-02 (2 Sides)",
        "capacity": "Free & Unlimited",
        "numericCapacity": 0,
        "isUnlimited": True,
        "imageUrl": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
        "description": "Motorcycle Deck B (Free & Unlimited Parking).",
        "color": "#d97706",
        "bgLight": "#fef3c7"
    },
    {
        "id": "Zone C",
        "name": "Zone C",
        "tag": "Cars Only",
        "badgeClass": "badge-live",
        "location": "Floor G - Automobile Deck C",
        "pillars": "Spots C-01 - C-08",
        "capacity": "8 Car Spots",
        "numericCapacity": 8,
        "isUnlimited": False,
        "imageUrl": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80",
        "description": "Automobile Deck C (C-01 to C-08).",
        "color": "#9333ea",
        "bgLight": "#f3e8ff"
    },
    {
        "id": "Zone D",
        "name": "Zone D",
        "tag": "Motorcycles",
        "badgeClass": "badge-warning",
        "location": "Floor G - Motorcycle Deck D",
        "pillars": "Spot D-01",
        "capacity": "Free & Unlimited",
        "numericCapacity": 0,
        "isUnlimited": True,
        "imageUrl": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
        "description": "Single Motorcycle Deck D (Free & Unlimited Parking).",
        "color": "#059669",
        "bgLight": "#dcfce7"
    }
]

DEFAULT_POLICY = {
    "key": "parking_policy",
    "max_car_parking_minutes": 30,
    "peak_hours_cutoff": "16:30",
    "overtime_penalty_points": 10,
    "helmet_penalty_points": 10,
    "updated_at": "2026-09-16T10:42:00Z"
}

DEFAULT_GATES = [
    {
        "gate_id": "GATE-ENTRY-01",
        "camera_id": "01",
        "name": "VMES Entry Gate (Cam 01)",
        "type": "ENTRY",
        "location": "VMES Building Entrance Gate - Camera 01"
    },
    {
        "gate_id": "GATE-EXIT-01",
        "camera_id": "02",
        "name": "VMES Exit Gate (Cam 02)",
        "type": "EXIT",
        "location": "VMES Building Exit Gate - Camera 02"
    }
]

def seed():
    if building_zones_collection is not None:
        for z in DEFAULT_ZONES:
            building_zones_collection.update_one({"id": z["id"]}, {"$set": z}, upsert=True)
        print("[SEED MongoDB] Building Zones seeded cleanly.")

    if system_settings_collection is not None:
        system_settings_collection.update_one({"key": "parking_policy"}, {"$set": DEFAULT_POLICY}, upsert=True)
        print("[SEED MongoDB] Parking Policy settings seeded cleanly.")

    if registered_gates_collection is not None:
        for g in DEFAULT_GATES:
            registered_gates_collection.update_one({"gate_id": g["gate_id"]}, {"$set": g}, upsert=True)
        print("[SEED MongoDB] Registered Gates seeded cleanly.")

if __name__ == "__main__":
    seed()
