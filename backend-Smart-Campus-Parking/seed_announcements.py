import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import announcements_collection, db

SAMPLE_ANNOUNCEMENTS = [
    {
        "id": "ANN-01",
        "title": "Zone B Maintenance Notice",
        "content": "Zone B Floor G will be temporarily closed for sensor maintenance tomorrow from 09:00 AM to 02:00 PM. Please park at Zone A or Zone C.",
        "date": "2026-09-17 09:00",
        "created_at": "2026-09-17T09:00:00+07:00",
        "priority": "high",
        "target_audience": "all",
        "target_user": "",
        "expire_date": "2026-12-31"
    },
    {
        "id": "ANN-02",
        "title": "Helmet Safety Policy Reminder",
        "content": "All motorcycle drivers must wear a safety helmet when entering university gates. AI CCTV cameras will record helmet compliance.",
        "date": "2026-09-16 14:00",
        "created_at": "2026-09-16T14:00:00+07:00",
        "priority": "normal",
        "target_audience": "all",
        "target_user": "",
        "expire_date": "2026-12-31"
    }
]

def seed_announcements():
    if announcements_collection is None:
        print("[SEED ERROR] Database connection not available!", file=sys.stderr)
        return

    print("[SEED] Cleaning up old announcements collection records...")
    announcements_collection.delete_many({})

    print("[SEED] Inserting sample campus announcements...")
    announcements_collection.insert_many(SAMPLE_ANNOUNCEMENTS)
    print(f"[SEED SUCCESS] Seeded {len(SAMPLE_ANNOUNCEMENTS)} announcements to MongoDB Atlas successfully!")

if __name__ == "__main__":
    seed_announcements()
