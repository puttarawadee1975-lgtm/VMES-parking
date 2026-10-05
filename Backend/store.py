"""
Shared In-Memory Data Store and Helper Functions for SafeRide VMES Parking
"""

from database import is_db_connected

# In-Memory Saved Spot Registry
saved_spots_memory = []

# Mock Enforcement Status
enforcement_status = {
    "enabled": True
}

# Registered Vehicles Directory (Linked via user_id PK/FK)
registered_vehicles = [
    {
        "id": 1,
        "user_id": "GUEST",
        "plate": "ก-1687",
        "license_plate": "ก-1687",
        "province": "Bangkok",
        "vehicle_type": "car",
        "brand": "Toyota",
        "model": "Toyota Yaris",
        "color": "Silver",
        "owner": "Guest Driver",
        "user_email": "guest@student.ac.th",
        "role": "Guest",
        "score": 50,
        "status": "Active",
        "registered_at": "2026-09-18T07:11:35.797Z",
        "vehicle_photo": "/snapshots/entry_cam01_1789715495_ก1687.jpg"
    },
    {
        "id": 2,
        "user_id": "6612345",
        "plate": "1กข 1234",
        "license_plate": "1กข 1234",
        "province": "Bangkok",
        "vehicle_type": "car",
        "brand": "Honda",
        "model": "Honda City",
        "color": "Black",
        "owner": "John Smith",
        "user_email": "john@student.ac.th",
        "role": "Student",
        "score": 51,
        "status": "Active",
        "registered_at": "2026-09-20T09:30:00Z",
        "vehicle_photo": None
    },
    {
        "id": 3,
        "user_id": "65070042",
        "plate": "3กฮ 5678",
        "license_plate": "3กฮ 5678",
        "province": "Bangkok",
        "vehicle_type": "motorcycle",
        "brand": "Yamaha",
        "model": "Yamaha NMAX 155",
        "color": "Red",
        "owner": "Somchai Jaidee",
        "user_email": "somchai@student.university.ac.th",
        "role": "Student",
        "score": 100,
        "status": "Active",
        "registered_at": "2026-09-21T11:15:00Z",
        "vehicle_photo": None
    },
    {
        "id": 4,
        "user_id": "1",
        "plate": "2ขค 9999",
        "license_plate": "2ขค 9999",
        "province": "Bangkok",
        "vehicle_type": "motorcycle",
        "brand": "Honda",
        "model": "Honda Wave 110i",
        "color": "Blue",
        "owner": "Somsri Rakdeeying",
        "user_email": "somsri@university.ac.th",
        "role": "Staff",
        "score": 95,
        "status": "Active",
        "registered_at": "2026-09-22T14:20:00Z",
        "vehicle_photo": None
    },
    {
        "id": 5,
        "user_id": "2",
        "plate": "ขก 888",
        "license_plate": "ขก 888",
        "province": "Bangkok",
        "vehicle_type": "car",
        "brand": "Mazda",
        "model": "Mazda 3",
        "color": "White",
        "owner": "Prof. Anan Suksan",
        "user_email": "anan@university.ac.th",
        "role": "Faculty",
        "score": 90,
        "status": "Active",
        "registered_at": "2026-09-23T08:45:00Z",
        "vehicle_photo": None
    },
    {
        "id": 6,
        "user_id": "6814509",
        "plate": "3กค 5678",
        "license_plate": "3กค 5678",
        "province": "Bangkok",
        "vehicle_type": "car",
        "brand": "Honda",
        "model": "Honda Civic RS (Black)",
        "color": "Black",
        "owner": "Pattarawadee A.",
        "user_email": "u6814509@au.edu",
        "role": "Student",
        "score": 100,
        "status": "Active",
        "registered_at": "2026-09-25T10:00:00Z",
        "vehicle_photo": None
    }
]

# Driver Score Audit Logs
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

# Notifications List (Only Helmet Safety Alerts and Announcements)
user_notifications = [
    {
        "id": "NOTIF-001",
        "title": "Safety Alert: Helmet Violation Warning",
        "message": "Riding without a helmet was detected at Gate 1 Entrance. -10 Driving Score points deducted.",
        "type": "helmet_violation",
        "category": "Safety Alert",
        "scoreDeducted": 10,
        "location": "Gate 1 (Main Entrance)",
        "timestamp": "2026-10-04T08:30:00.000Z",
        "read": False
    }
]

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
