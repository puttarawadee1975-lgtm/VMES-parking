import os
import time
from datetime import datetime, timedelta, timezone
from database import detection_logs_collection, saved_spots_collection

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
SNAPSHOTS_DIR = os.path.join(DATA_DIR, "snapshots")
VEHICLE_PHOTOS_DIR = os.path.join(DATA_DIR, "vehicle_photos")

def resolve_local_filepath(url_or_path: str) -> str | None:
    """Extract physical file system path from local static URL or relative path."""
    if not url_or_path or not isinstance(url_or_path, str):
        return None
    
    if url_or_path.startswith("/snapshots/"):
        filename = url_or_path.removeprefix("/snapshots/")
        return os.path.join(SNAPSHOTS_DIR, filename)
    elif url_or_path.startswith("/vehicle_photos/"):
        filename = url_or_path.removeprefix("/vehicle_photos/")
        return os.path.join(VEHICLE_PHOTOS_DIR, filename)
    elif "snapshots/" in url_or_path:
        filename = os.path.basename(url_or_path)
        return os.path.join(SNAPSHOTS_DIR, filename)
    elif "vehicle_photos/" in url_or_path:
        filename = os.path.basename(url_or_path)
        return os.path.join(VEHICLE_PHOTOS_DIR, filename)
    elif os.path.isabs(url_or_path) and os.path.exists(url_or_path):
        return url_or_path
    
    return None

def delete_local_image_file(file_url_or_path: str) -> bool:
    """Deletes image file from backend storage if it exists on disk."""
    filepath = resolve_local_filepath(file_url_or_path)
    if filepath and os.path.isfile(filepath):
        try:
            os.remove(filepath)
            print(f"[CLEANUP] Successfully deleted file from disk: {filepath}")
            return True
        except Exception as e:
            print(f"[CLEANUP ERROR] Failed to delete file {filepath}: {e}")
    return False

def cleanup_old_records_and_images(retention_days: int = 30) -> dict:
    """
    Deletes history records and detection logs older than `retention_days` (default 30 days)
    from MongoDB Atlas AND removes all associated evidence image files from backend disk storage.
    """
    now = datetime.now(timezone.utc)
    cutoff_date = now - timedelta(days=retention_days)
    cutoff_timestamp = cutoff_date.timestamp()

    deleted_logs_count = 0
    deleted_images_count = 0
    deleted_spots_count = 0

    print(f"[RETENTION CLEANUP] Running {retention_days}-day data & image purge (Cutoff: {cutoff_date.isoformat()})...")

    # 1. Clean detection_logs (Gate entries/exits & violations older than 30 days)
    if detection_logs_collection is not None:
        try:
            old_logs = list(detection_logs_collection.find({
                "$or": [
                    {"timestamp": {"$lt": cutoff_date}},
                    {"created_at": {"$lt": cutoff_date}}
                ]
            }))

            old_ids = []
            for doc in old_logs:
                old_ids.append(doc["_id"])
                # Check all potential image/snapshot URL fields
                image_fields = ["snapshot_url", "image_url", "photo_url", "evidence_url", "license_plate_crop_url"]
                for field in image_fields:
                    img_url = doc.get(field)
                    if img_url and delete_local_image_file(img_url):
                        deleted_images_count += 1

            if old_ids:
                res = detection_logs_collection.delete_many({"_id": {"$in": old_ids}})
                deleted_logs_count = res.deleted_count
        except Exception as err:
            print(f"[RETENTION CLEANUP ERROR - detection_logs] {err}")

    # 2. Clean saved_spots (parking location history older than 30 days)
    if saved_spots_collection is not None:
        try:
            old_spots = list(saved_spots_collection.find({
                "timestamp": {"$lt": cutoff_date}
            }))
            spot_ids = []
            for spot in old_spots:
                spot_ids.append(spot["_id"])
                img_url = spot.get("photo_url") or spot.get("image_url")
                if img_url and delete_local_image_file(img_url):
                    deleted_images_count += 1

            if spot_ids:
                res = saved_spots_collection.delete_many({"_id": {"$in": spot_ids}})
                deleted_spots_count = res.deleted_count
        except Exception as err:
            print(f"[RETENTION CLEANUP ERROR - saved_spots] {err}")

    # 3. Purge expired static snapshot image files in snapshots directory older than retention_days
    if os.path.exists(SNAPSHOTS_DIR):
        for filename in os.listdir(SNAPSHOTS_DIR):
            file_path = os.path.join(SNAPSHOTS_DIR, filename)
            if os.path.isfile(file_path):
                try:
                    file_mtime = os.path.getmtime(file_path)
                    if file_mtime < cutoff_timestamp:
                        os.remove(file_path)
                        deleted_images_count += 1
                        print(f"[RETENTION CLEANUP] Removed expired snapshot image: {filename}")
                except Exception as err:
                    print(f"[RETENTION CLEANUP ERROR - Snapshot Purge] {err}")

    summary = {
        "status": "success",
        "retention_days": retention_days,
        "cutoff_date": cutoff_date.isoformat(),
        "deleted_detection_logs": deleted_logs_count,
        "deleted_saved_spots": deleted_spots_count,
        "deleted_image_files": deleted_images_count
    }
    print(f"[RETENTION CLEANUP COMPLETE] Summary: {summary}")
    return summary

def cleanup_old_term_data(term_name: str) -> dict:
    """
    Deletes all detection logs and saved spots belonging to `term_name` (e.g. 2025-2, 2025-1)
    from MongoDB Atlas AND removes all associated photo files from backend disk storage.
    """
    deleted_logs_count = 0
    deleted_images_count = 0

    if detection_logs_collection is not None:
        try:
            term_logs = list(detection_logs_collection.find({"term": term_name}))
            log_ids = []
            for doc in term_logs:
                log_ids.append(doc["_id"])
                for field in ["snapshot_url", "image_url", "photo_url", "evidence_url", "cctv_image_url"]:
                    img_url = doc.get(field)
                    if img_url and delete_local_image_file(img_url):
                        deleted_images_count += 1
            if log_ids:
                res = detection_logs_collection.delete_many({"_id": {"$in": log_ids}})
                deleted_logs_count = res.deleted_count
        except Exception as err:
            print(f"[TERM CLEANUP ERROR - detection_logs] {err}")

    if saved_spots_collection is not None:
        try:
            saved_spots_collection.delete_many({"term": term_name})
        except Exception as err:
            print(f"[TERM CLEANUP ERROR - saved_spots] {err}")

    summary = {
        "status": "success",
        "term": term_name,
        "deleted_logs": deleted_logs_count,
        "deleted_images": deleted_images_count
    }
    print(f"[TERM CLEANUP COMPLETE] Summary: {summary}")
    return summary
