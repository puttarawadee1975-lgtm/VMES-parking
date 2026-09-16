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
    PERMANENT RETENTION POLICY: Data deletion disabled.
    All historical detection logs, saved spots, and snapshot images are retained permanently in MongoDB Atlas.
    """
    print("[RETENTION POLICY] Data deletion disabled. All historical records & images are retained permanently.")
    return {
        "status": "disabled",
        "message": "Data purge disabled. All historical records & images are retained permanently in MongoDB Atlas.",
        "retention_days": retention_days,
        "deleted_detection_logs": 0,
        "deleted_saved_spots": 0,
        "deleted_image_files": 0
    }

def cleanup_old_term_data(term_name: str) -> dict:
    """
    PERMANENT RETENTION POLICY: Term data deletion disabled.
    All historical term data is retained permanently in MongoDB Atlas.
    """
    print(f"[RETENTION POLICY] Term data deletion disabled for '{term_name}'. All records retained permanently.")
    return {
        "status": "disabled",
        "message": f"Term data purge disabled. All records for term '{term_name}' are retained permanently.",
        "term": term_name,
        "deleted_logs": 0,
        "deleted_images": 0
    }

