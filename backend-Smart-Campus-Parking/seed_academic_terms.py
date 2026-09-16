import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DB_NAME") or os.getenv("MONGODB_DB") or "Smart-Parking"

def seed_academic_terms_and_resets():
    """
    Seeds both academic_terms and semester_resets collections in MongoDB Atlas.
    """
    print(f"[SEED] Connecting to MongoDB Atlas (DB: '{DB_NAME}')...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    # 1. Seed academic_terms collection
    terms_collection = db["academic_terms"]
    academic_terms_data = [
        {
            "term_id": 1,
            "name": "Semester 1",
            "months_display": "June - November",
            "start_month": 6,
            "end_month": 11,
            "reset_date_str": "1 June",
            "reset_day": 1,
            "reset_month": 6,
            "description": "First Semester (June to November). Driver safety scores automatically reset to 100 on 1 June.",
            "is_active": True
        },
        {
            "term_id": 2,
            "name": "Semester 2",
            "months_display": "November - March",
            "start_month": 11,
            "end_month": 3,
            "reset_date_str": "1 November",
            "reset_day": 1,
            "reset_month": 11,
            "description": "Second Semester (November to March). Driver safety scores automatically reset to 100 on 1 November.",
            "is_active": True
        },
        {
            "term_id": 3,
            "name": "Semester 3 (Summer)",
            "months_display": "April - May",
            "start_month": 4,
            "end_month": 5,
            "reset_date_str": "1 April",
            "reset_day": 1,
            "reset_month": 4,
            "description": "Summer Semester (April to May). Driver safety scores automatically reset to 100 on 1 April.",
            "is_active": True
        }
    ]

    terms_collection.delete_many({})
    res1 = terms_collection.insert_many(academic_terms_data)
    print(f"✅ Successfully created & populated 'academic_terms' collection ({len(res1.inserted_ids)} terms)")

    # 2. Seed / Initialize semester_resets collection
    resets_collection = db["semester_resets"]
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    # Ensure collection exists and has initial term reset audit record
    initial_reset_record = {
        "term_code": "2026-SEM1",
        "semester_name": "Semester 1 (June - Nov)",
        "reset_at": now_str,
        "reset_count": 5,
        "auto_triggered": True,
        "status": "COMPLETED",
        "note": "Initial semester reset log created for Semester 1 (June - Nov)"
    }

    if resets_collection.count_documents({"term_code": "2026-SEM1"}) == 0:
        resets_collection.insert_one(initial_reset_record)
        print(f"✅ Successfully created & populated 'semester_resets' collection with term reset audit log ('2026-SEM1')!")
    else:
        print(f"ℹ️ Collection 'semester_resets' already contains reset records.")

    print("\n--- Summary of Collections in DB 'Smart-Parking' ---")
    for col_name in db.list_collection_names():
        print(f" • Collection: {col_name} (Documents: {db[col_name].count_documents({})})")

if __name__ == "__main__":
    seed_academic_terms_and_resets()
