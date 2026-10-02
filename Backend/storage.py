import os
import re
import base64
import time
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOTS_DIR = os.path.join(_BACKEND_DIR, "data", "snapshots")
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

# Read AWS & Storage Configuration from environment
STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local").strip().lower()
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1").strip()
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "").strip()
AWS_S3_CUSTOM_DOMAIN = os.getenv("AWS_S3_CUSTOM_DOMAIN", "").strip()

# Lazy-loaded S3 client singleton
_s3_client = None

def get_s3_client():
    """Initializes and returns boto3 S3 client if configured, otherwise returns None."""
    global _s3_client
    if _s3_client is not None:
        return _s3_client
    
    if not (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET):
        return None
        
    try:
        import boto3
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        print(f"[Storage] AWS S3 storage initialized for bucket: {AWS_S3_BUCKET}")
        return _s3_client
    except Exception as e:
        print(f"[Storage Warning] Could not initialize boto3 S3 client: {e}")
        return None

def save_snapshot(img_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """
    Saves snapshot image bytes either to AWS S3 or Local Disk depending on STORAGE_PROVIDER config.
    Returns public image URL (e.g. 'https://bucket.s3.region.amazonaws.com/snapshots/file.jpg' or '/snapshots/file.jpg')
    """
    # 1. Try AWS S3 if enabled and configured
    if STORAGE_PROVIDER == "s3":
        s3 = get_s3_client()
        if s3 and AWS_S3_BUCKET:
            try:
                s3_key = f"snapshots/{filename}"
                s3.put_object(
                    Bucket=AWS_S3_BUCKET,
                    Key=s3_key,
                    Body=img_bytes,
                    ContentType=content_type,
                    # ACL="public-read" # Uncomment if bucket requires public ACL
                )
                if AWS_S3_CUSTOM_DOMAIN:
                    public_url = f"https://{AWS_S3_CUSTOM_DOMAIN}/{s3_key}"
                else:
                    public_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
                print(f"[Storage S3 Success] Uploaded {filename} to S3 -> {public_url}")
                return public_url
            except Exception as e:
                print(f"[Storage S3 Error] Upload to S3 failed: {e}. Falling back to local disk storage.")

    # 2. Local Disk Fallback / Default
    filepath = os.path.join(SNAPSHOTS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    local_url = f"/snapshots/{filename}"
    print(f"[Storage Local] Saved snapshot to local disk -> {local_url}")
    return local_url

def save_base64_snapshot(base64_str: str, license_plate: str, gate_type: str = "entry") -> Optional[str]:
    """Decodes base64 Data URI string and saves snapshot via storage abstraction."""
    if not base64_str or not isinstance(base64_str, str):
        return None
    try:
        if base64_str.startswith("data:"):
            _, encoded = base64_str.split(",", 1)
        else:
            encoded = base64_str

        img_bytes = base64.b64decode(encoded)
        clean_lp = re.sub(r"[^a-zA-Z0-9ก-ฮ]", "", license_plate or "veh") or "veh"
        unix_ts = int(time.time())
        filename = f"{gate_type.lower()}_{unix_ts}_{clean_lp}.jpg"

        return save_snapshot(img_bytes, filename)
    except Exception as e:
        print(f"[Storage Error] save_base64_snapshot failed: {e}")
        return None
