import asyncio
import os
import glob
from datetime import datetime
from database import (
    is_db_connected,
    registered_vehicles_collection,
    users_collection,
    detection_logs_collection,
    system_settings_collection
)
import store

# Academic Term Schedule:
# Term 1: 1 June - 31 October
# Term 2: 1 November - 31 March
# Term 3: 1 April - 31 May
TERM_SCHEDULE = {
    6:  {"term_num": 1, "name": "Term 1 (Semester 1)", "desc": "1 June – 31 October"},
    11: {"term_num": 2, "name": "Term 2 (Semester 2)", "desc": "1 November – 31 March"},
    4:  {"term_num": 3, "name": "Term 3 (Summer)",     "desc": "1 April – 31 May"}
}

def get_current_academic_term(dt=None):
    """Calculates the active academic term and academic year for any given datetime."""
    if dt is None:
        dt = datetime.now()
    month = dt.month
    year = dt.year

    if 6 <= month <= 10:
        return {
            "term_id": f"{year}-1",
            "term_num": 1,
            "name": f"Semester 1 / {year}",
            "period": f"01 Jun {year} – 31 Oct {year}",
            "start_month": 6
        }
    elif month >= 11 or month <= 3:
        acad_year = year if month >= 11 else year - 1
        next_year = acad_year + 1
        return {
            "term_id": f"{acad_year}-2",
            "term_num": 2,
            "name": f"Semester 2 / {acad_year}",
            "period": f"01 Nov {acad_year} – 31 Mar {next_year}",
            "start_month": 11
        }
    else:  # 4 <= month <= 5 (April - May)
        acad_year = year - 1
        return {
            "term_id": f"{acad_year}-3",
            "term_num": 3,
            "name": f"Semester 3 / {acad_year} (Summer)",
            "period": f"01 Apr {year} – 31 May {year}",
            "start_month": 4
        }

def purge_ended_term_data(current_term_id: str):
    """
    Cleans up detection logs in MongoDB and snapshot photo files from previous ended terms,
    as required by the per-term data lifecycle policy.
    """
    if not is_db_connected() or detection_logs_collection is None:
        return

    try:
        # 1. Identify previous term logs (documents where term != current_term_id)
        old_logs_query = {
            "$and": [
                {"term": {"$exists": True, "$ne": current_term_id}},
                {"term": {"$ne": ""}}
            ]
        }
        old_logs = list(detection_logs_collection.find(old_logs_query))
        
        # 2. Delete associated snapshot images from disk
        snapshots_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "snapshots")
        deleted_photos = 0
        for log in old_logs:
            det_id = str(log.get("id") or log.get("_id") or "")
            if det_id:
                for img_path in glob.glob(os.path.join(snapshots_dir, f"*{det_id}*")):
                    try:
                        os.remove(img_path)
                        deleted_photos += 1
                    except Exception:
                        pass

        # 3. Remove old term logs from MongoDB
        del_res = detection_logs_collection.delete_many(old_logs_query)
        print(f"[Term Lifecycle] 🧹 Cleaned up ended term data: {del_res.deleted_count} logs and {deleted_photos} photos purged.")
    except Exception as e:
        print(f"[Term Lifecycle] ⚠️ Notice while purging ended term data: {e}")

def perform_term_score_reset(term_info: dict):
    """
    Resets all driver safety scores to 100 in MongoDB and in-memory store for the new term,
    and purges data from the previous term.
    """
    term_id = term_info["term_id"]
    term_name = term_info["name"]

    # 1. Reset in-memory registered vehicles
    for v in store.registered_vehicles:
        v["score"] = 100

    # 2. Reset database scores
    if is_db_connected():
        try:
            if registered_vehicles_collection is not None:
                registered_vehicles_collection.update_many({}, {"$set": {"score": 100, "driving_score": 100}})
            if users_collection is not None:
                users_collection.update_many({}, {"$set": {"driving_score": 100}})

            # 3. Purge ended term data (MongoDB records and photos)
            purge_ended_term_data(term_id)

            # 4. Save audit log of term reset
            if system_settings_collection is not None:
                system_settings_collection.update_one(
                    {"key": "last_term_safety_reset"},
                    {"$set": {
                        "key": "last_term_safety_reset",
                        "term_id": term_id,
                        "term_name": term_name,
                        "reset_at": datetime.now().isoformat()
                    }},
                    upsert=True
                )
            print(f"[Term Reset Scheduler] ✅ Successfully reset all driver safety scores to 100 for {term_name} ({term_id})")
        except Exception as e:
            print(f"[Term Reset Scheduler] ⚠️ Failed to execute term reset in DB: {e}")

async def monthly_score_reset_loop():
    """
    Background worker checking hourly whether today is Day 1 of a new Academic Term:
      - 1 June: Term 1 Start (1 Jun - 31 Oct)
      - 1 November: Term 2 Start (1 Nov - 31 Mar)
      - 1 April: Term 3 Start (1 Apr - 31 May)
    """
    print("[Term Reset Scheduler] Initialized academic term safety score reset worker.")
    while True:
        try:
            now = datetime.now()
            # Check if today is the 1st of a term start month (June=6, November=11, April=4)
            if now.day == 1 and now.month in TERM_SCHEDULE and is_db_connected():
                term_info = get_current_academic_term(now)
                current_term_id = term_info["term_id"]

                last_record = None
                if system_settings_collection is not None:
                    last_record = system_settings_collection.find_one({"key": "last_term_safety_reset"})

                # Execute reset only once per term start
                if not last_record or last_record.get("term_id") != current_term_id:
                    print(f"[Term Reset Scheduler] 🔔 First day of {term_info['name']} detected! Executing automatic term reset...")
                    perform_term_score_reset(term_info)
        except Exception as e:
            print(f"[Term Reset Scheduler] Error in loop: {e}")

        # Sleep for 1 hour before next evaluation
        await asyncio.sleep(3600)
