import os
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/"
db_name = os.getenv("DB_NAME", "Smart-Parking")

client = MongoClient(uri)
db = client[db_name]
detection_logs_col = db["detection_logs"]
registered_vehicles_col = db["registered_vehicles"]
users_col = db["users"]

# Clear old sample logs
detection_logs_col.delete_many({})

now = datetime.now(timezone.utc)

mock_detections = [
    {
        "license_plate": "3กฮ 5678",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "motorcycle",
        "helmet_detected": False,
        "violation": True,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(minutes=5),
        "matched_email": "65070118@student.university.ac.th",
        "matched_user": "Nattapong K."
    },
    {
        "license_plate": "1กข 1234",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "motorcycle",
        "helmet_detected": True,
        "violation": False,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(minutes=12),
        "matched_email": "65070042@student.university.ac.th",
        "matched_user": "Thanaphat S."
    },
    {
        "license_plate": "7กน 4421",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "motorcycle",
        "helmet_detected": False,
        "violation": True,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(minutes=24),
        "matched_email": "65070892@student.university.ac.th",
        "matched_user": "Phuvadet C."
    },
    {
        "license_plate": "9กข 9999",
        "province": "สมุทรปราการ",
        "vehicle_type": "car",
        "helmet_detected": None,
        "violation": False,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone A (Ground Floor - Cars)",
        "timestamp": now - timedelta(minutes=35),
        "matched_email": "somchai@university.ac.th",
        "matched_user": "Dr. Somchai P."
    },
    {
        "license_plate": "1กข 9988",
        "province": "นนทบุรี",
        "vehicle_type": "motorcycle",
        "helmet_detected": False,
        "violation": True,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(minutes=48),
        "matched_email": None,
        "matched_user": "Guest / Delivery Rider"
    },
    {
        "license_plate": "2กข 4321",
        "province": "นนทบุรี",
        "vehicle_type": "motorcycle",
        "helmet_detected": True,
        "violation": False,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(hours=1, minutes=10),
        "matched_email": "65070244@student.university.ac.th",
        "matched_user": "Chayanan T."
    },
    {
        "license_plate": "4กผ 7712",
        "province": "ปทุมธานี",
        "vehicle_type": "motorcycle",
        "helmet_detected": False,
        "violation": True,
        "gate_type": "Exit gate",
        "camera_id": 2,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(hours=1, minutes=35),
        "matched_email": "65070511@student.university.ac.th",
        "matched_user": "Krit T."
    },
    {
        "license_plate": "5กษ 8888",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "car",
        "helmet_detected": None,
        "violation": False,
        "gate_type": "Exit gate",
        "camera_id": 2,
        "zone": "Zone C (Floor G - Staff & Cars)",
        "timestamp": now - timedelta(hours=2, minutes=5),
        "matched_email": "65070399@student.university.ac.th",
        "matched_user": "Pattarapon M."
    },
    {
        "license_plate": "8กอ 3319",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "motorcycle",
        "helmet_detected": False,
        "violation": True,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(hours=2, minutes=40),
        "matched_email": "65070399@student.university.ac.th",
        "matched_user": "Pattarapon M."
    },
    {
        "license_plate": "6กจ 1122",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "motorcycle",
        "helmet_detected": True,
        "violation": False,
        "gate_type": "Exit gate",
        "camera_id": 2,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(hours=3, minutes=15),
        "matched_email": "65070199@student.university.ac.th",
        "matched_user": "Suthipong W."
    },
    {
        "license_plate": "ขก 4455",
        "province": "เชียงใหม่",
        "vehicle_type": "car",
        "helmet_detected": None,
        "violation": False,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone A (Ground Floor - Cars)",
        "timestamp": now - timedelta(hours=4, minutes=00),
        "matched_email": None,
        "matched_user": "Guest Visitor"
    },
    {
        "license_plate": "5กฮ 2244",
        "province": "กรุงเทพมหานคร",
        "vehicle_type": "motorcycle",
        "helmet_detected": False,
        "violation": True,
        "gate_type": "Entry gate",
        "camera_id": 1,
        "zone": "Zone B (Floor G - Motorcycles)",
        "timestamp": now - timedelta(hours=4, minutes=45),
        "matched_email": "65070777@student.university.ac.th",
        "matched_user": "Ananda R."
    }
]

res = detection_logs_col.insert_many(mock_detections)
print(f"Successfully seeded {len(res.inserted_ids)} gate detection & violation logs into MongoDB!")
