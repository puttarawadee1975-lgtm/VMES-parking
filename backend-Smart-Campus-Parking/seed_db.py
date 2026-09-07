from datetime import datetime, timezone
from database import db, users_collection, parking_status_collection, detection_logs_collection
from database import db, users_collection, parking_status_collection, detection_logs_collection, DB_NAME

def seed():
    if db is None:
        print("Database not connected, cannot seed data.")
        return

    print(f"Seeding database '{DB_NAME}'...")

    # 1. Seed Buildings Collection (Central configuration for Admin Web)
    buildings_collection = db["buildings"]
    buildings_collection.delete_many({})
    buildings_data = [
        {
            "building_id": "vems_bldg",
            "name": "VEMS Building",
            "floors": ["Floor G"],
            "zones": [
                {"zone_id": "zone_a", "name": "Zone A", "floor": "Floor G", "total_slots": 6, "pillar_range": "G01-G05"},
                {"zone_id": "zone_b", "name": "Zone B", "floor": "Floor G", "total_slots": 6, "pillar_range": "G06-G10"},
                {"zone_id": "zone_c", "name": "Zone C", "floor": "Floor G", "total_slots": 6, "pillar_range": "G11-G15"}
            ],
            "admin_floorplan_url": "",  # Blank placeholder for Admin Web to upload/edit
            "last_updated": datetime.now(timezone.utc)
        }
    ]
    for bldg in buildings_data:
        buildings_collection.update_one({"building_id": bldg["building_id"]}, {"$set": bldg}, upsert=True)
    print("✓ Seeded buildings collection (VEMS Building config for Admin).")

    # 2. Seed Parking Status Zones (Total capacity = 18 slots for VEMS Building)
    parking_status_collection.delete_many({})
    initial_zones = [
        {
            "zone": "Zone A • Floor G (VEMS Building)",
            "building": "VEMS Building",
            "floor": "Floor G",
            "total_slots": 6,
            "occupied_slots": 2,
            "available_slots": 4,
            "last_updated": datetime.now(timezone.utc)
        },
        {
            "zone": "Zone B • Floor G (VEMS Building)",
            "building": "VEMS Building",
            "floor": "Floor G",
            "total_slots": 6,
            "occupied_slots": 1,
            "available_slots": 5,
            "last_updated": datetime.now(timezone.utc)
        },
        {
            "zone": "Zone C • Floor G (VEMS Building)",
            "building": "VEMS Building",
            "floor": "Floor G",
            "total_slots": 6,
            "occupied_slots": 3,
            "available_slots": 3,
            "last_updated": datetime.now(timezone.utc)
        }
    ]

    for zone_data in initial_zones:
        parking_status_collection.update_one(
            {"zone": zone_data["zone"]},
            {"$set": zone_data},
            upsert=True
        )
    print("✓ Seeded parking_status collection with VEMS Building zones (Zone A, B, C).")

    # 3. Seed Initial Users (Office, Officer, Student)
    initial_users = [
        {
            "email": "student01@gmail.com",
            "role": "student",
            "name": "Wen Bin",
            "id": "6610001",
            "license_plate": "1กข-9999",
            "driving_score": 90,
            "vehicles": [{"plate": "1กข-9999", "type": "motorcycle"}]
        },
        {
            "email": "admin@gmail.com",
            "role": "admin",
            "name": "Min",
            "id": "01",
            "license_plate": "-",
            "driving_score": 100,
            "vehicles": []
        },
        {
            "email": "admin.office@smartcampus.ac.th",
            "role": "office",
            "name": "Campus Officer Admin",
            "id": "OFF001",
            "driving_score": 100,
            "vehicles": [{"plate": "9กง-1234", "type": "car"}]
        }
    ]

    for user_data in initial_users:
        users_collection.update_one(
            {"email": user_data["email"]},
            {"$set": user_data},
            upsert=True
        )
    print("✓ Seeded users collection.")

    # 4. Seed Saved Parking Spots (Initially Empty until user scans QR)
    saved_spots_collection = db["saved_spots"]
    saved_spots_collection.delete_many({})
    print("✓ Cleared saved_spots collection (empty until user saves).")

    # 5. Seed Detection Logs (Safety violations, License plate detections)
    detection_logs_collection.delete_many({})
    sample_logs = [
        {
            "license_plate": "1กข-9999",
            "event": "No Helmet Detected",
            "score_deducted": 10,
            "timestamp": datetime.now(timezone.utc),
            "camera_location": "VEMS Building Main Entrance Gate"
        }
    ]
    for log in sample_logs:
        detection_logs_collection.insert_one(log)
    print("✓ Seeded detection_logs collection for Admin analytics.")

    print("\nAll central MongoDB collections seeded successfully!")

if __name__ == "__main__":
    seed()
