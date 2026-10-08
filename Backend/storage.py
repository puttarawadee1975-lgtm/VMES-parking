"""Snapshot storage and read-only URL resolution; credentials belong to the SDK."""
import base64
import binascii
import io
import os
from threading import Lock
from urllib.parse import unquote, urlsplit
from uuid import uuid4

from dotenv import load_dotenv

load_dotenv(override=False)

SNAPSHOTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "snapshots")
STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local").strip().lower()
AWS_REGION = os.getenv("AWS_REGION", "").strip()
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "").strip()
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000
_s3_client = None
_s3_lock = Lock()


class SnapshotStorageError(RuntimeError):
    """Safe public diagnostic with no SDK details or signed URLs."""


def _s3_settings():
    if not AWS_REGION or not AWS_S3_BUCKET:
        raise SnapshotStorageError("S3 requires AWS_REGION and AWS_S3_BUCKET.")
    try:
        ttl = int(os.getenv("S3_PRESIGNED_URL_TTL_SECONDS", "900"))
        if not 1 <= ttl <= 3600:
            raise ValueError
    except ValueError:
        raise SnapshotStorageError("S3 presigned URL TTL must be 1 through 3600 seconds.") from None
    return ttl


def get_s3_client():
    """Reuse an SDK client using the default chain, including the EC2 role."""
    global _s3_client
    _s3_settings()
    with _s3_lock:
        if _s3_client is None:
            try:
                import boto3
                from botocore.config import Config
                _s3_client = boto3.client(
                    "s3", region_name=AWS_REGION,
                    config=Config(
                        signature_version="s3v4", connect_timeout=3, read_timeout=5,
                        retries={"mode": "standard", "total_max_attempts": 2},
                    ),
                )
            except Exception:
                raise SnapshotStorageError("S3 client initialization failed.") from None
    return _s3_client


def save_snapshot(img_bytes: bytes, filename=None, content_type=None) -> str:
    """Validate once and store under an opaque name; legacy name arguments are ignored."""
    if not img_bytes or len(img_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Snapshot must contain at most 10 MiB of image data.")
    try:
        from PIL import Image
    except ImportError:
        raise SnapshotStorageError("Snapshot image validation dependency unavailable.") from None
    try:
        with Image.open(io.BytesIO(img_bytes)) as image:
            image_format = image.format
            if image_format not in ("JPEG", "PNG") or image.width * image.height > MAX_IMAGE_PIXELS:
                raise ValueError
            image.verify()
        # Decode as well: JPEG verify() alone does not detect every truncated stream.
        with Image.open(io.BytesIO(img_bytes)) as image:
            image.load()
    except Exception:
        raise ValueError("Snapshot must be a valid JPEG or PNG of at most 20 million pixels.") from None
    extension, mime = ("jpg", "image/jpeg") if image_format == "JPEG" else ("png", "image/png")
    filename = f"{uuid4().hex}.{extension}"
    if STORAGE_PROVIDER == "s3":
        client = get_s3_client()
        key = f"snapshots/{filename}"
        try:
            client.put_object(Bucket=AWS_S3_BUCKET, Key=key, Body=img_bytes, ContentType=mime)
        except Exception:
            raise SnapshotStorageError("Snapshot upload to S3 failed.") from None
        return f"s3://{AWS_S3_BUCKET}/{key}"
    if STORAGE_PROVIDER != "local":
        raise SnapshotStorageError("STORAGE_PROVIDER must be local or s3.")
    try:
        os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
        with open(os.path.join(SNAPSHOTS_DIR, filename), "wb") as output:
            output.write(img_bytes)
    except OSError:
        raise SnapshotStorageError("Local snapshot storage failed.") from None
    return f"/snapshots/{filename}"


def save_base64_snapshot(base64_str: str, license_plate=None, gate_type="entry") -> str:
    """Decode transport data; plate and gate never form part of the object key."""
    if not isinstance(base64_str, str) or len(base64_str) > 4 * ((MAX_IMAGE_BYTES + 2) // 3) + 128:
        raise ValueError("Snapshot Base64 is invalid or too large.")
    encoded = base64_str
    if encoded.startswith("data:"):
        header, separator, encoded = encoded.partition(",")
        if not separator or header.lower() not in ("data:image/jpeg;base64", "data:image/png;base64"):
            raise ValueError("Snapshot data URI must contain a Base64 JPEG or PNG.")
    try:
        img_bytes = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise ValueError("Snapshot Base64 is invalid.") from None
    return save_snapshot(img_bytes)


def resolve_snapshot_url(reference):
    """Resolve configured S3 objects without uploading, restoring or changing records."""
    if not reference or not isinstance(reference, str):
        return reference
    try:
        parsed = urlsplit(reference)
    except ValueError:
        raise SnapshotStorageError("Invalid snapshot reference.") from None
    key = None
    if parsed.scheme == "s3":
        if parsed.netloc != AWS_S3_BUCKET or parsed.query or parsed.fragment:
            raise SnapshotStorageError("Snapshot reference is outside the configured S3 bucket.")
        key = unquote(parsed.path.lstrip("/"))
    elif parsed.scheme == "https" and AWS_S3_BUCKET and AWS_REGION:
        virtual_hosts = {
            f"{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com",
            f"{AWS_S3_BUCKET}.s3-{AWS_REGION}.amazonaws.com",
            f"{AWS_S3_BUCKET}.s3.amazonaws.com",
        }
        if parsed.netloc in virtual_hosts:
            key = unquote(parsed.path.lstrip("/"))
        elif parsed.netloc in {f"s3.{AWS_REGION}.amazonaws.com", "s3.amazonaws.com"}:
            bucket, separator, path = parsed.path.lstrip("/").partition("/")
            if bucket == AWS_S3_BUCKET and separator:
                key = unquote(path)
    if key is None:
        return reference  # Legacy local paths, data URIs and unrelated URLs remain unchanged.
    if not key.startswith("snapshots/") or not key[len("snapshots/"):] or "\\" in key or any(
        part in ("", ".", "..") for part in key.split("/")
    ):
        raise SnapshotStorageError("Snapshot reference is outside the snapshots prefix.")
    ttl = _s3_settings()
    try:
        return get_s3_client().generate_presigned_url(
            "get_object", Params={"Bucket": AWS_S3_BUCKET, "Key": key},
            ExpiresIn=ttl, HttpMethod="GET",
        )
    except Exception:
        raise SnapshotStorageError("Snapshot URL signing failed.") from None
