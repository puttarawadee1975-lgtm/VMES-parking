"""Shared MongoDB connection. Configuration must be supplied by the environment."""

import atexit
import os
import warnings

from dotenv import load_dotenv

load_dotenv(override=False)


class DatabaseUnavailableError(RuntimeError):
    """Sanitized persistence failure; never fall back to memory on this error."""


# Keep existing imports stable without guessing that the two saved-spot stores
# contain the same data. Accessing a handle does not create a collection.
COLLECTION_NAMES = {
    "users_collection": "users",
    "registered_vehicles_collection": "registered_vehicles",
    "detection_logs_collection": "detection_logs",
    "parking_status_collection": "parking_status",
    "parking_sessions_collection": "parking_sessions",
    "parking_spots_collection": "parking_spots",
    "user_saved_spots_collection": "user_saved_spots",
    "saved_spots_collection": "saved_spots",
    "system_settings_collection": "system_settings",
}

_client = None
_database = None


def _ping(client):
    try:
        client.admin.command("ping")
    except Exception:
        # Driver messages can contain connection details. Do not chain them.
        raise DatabaseUnavailableError(
            "MongoDB ping failed. Check service availability, network access, "
            "TLS configuration and database credentials."
        ) from None


def init_db():
    """Initialize once per process, or verify the existing reusable client."""
    global _client, _database
    if _client is not None:
        _ping(_client)
        return True

    uri = os.getenv("MONGODB_URL", "").strip()
    database_name = os.getenv("DATABASE_NAME", "").strip()
    if not uri or not database_name:
        raise DatabaseUnavailableError(
            "MongoDB configuration missing: MONGODB_URL and DATABASE_NAME "
            "must both be set in the environment."
        )
    if not uri.startswith(("mongodb://", "mongodb+srv://")):
        raise DatabaseUnavailableError(
            "MONGODB_URL must use the mongodb:// or mongodb+srv:// scheme."
        )

    try:
        from pymongo import MongoClient
    except ImportError:
        raise DatabaseUnavailableError(
            "MongoDB driver unavailable. Install Backend/requirements.txt."
        ) from None

    candidate = None
    try:
        # Constructor keyword options override URI options. Suppress parser
        # warnings because malformed URI options can contain sensitive values.
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            candidate = MongoClient(
                uri,
                connectTimeoutMS=10000,
                serverSelectionTimeoutMS=10000,
                socketTimeoutMS=15000,
                waitQueueTimeoutMS=10000,
                timeoutMS=15000,
                tz_aware=True,
                appname="vmes-parking-backend",
            )
        database = candidate[database_name]
        _ping(candidate)
    except Exception:
        if candidate is not None:
            candidate.close()
        raise DatabaseUnavailableError(
            "MongoDB initialization failed. Check MONGODB_URL syntax, "
            "DATABASE_NAME, DNS/network access, TLS and authentication."
        ) from None

    _client = candidate
    _database = database
    atexit.register(_client.close)
    return True



def get_mongo_client():
    """Return the initialized shared MongoDB client."""
    if _client is None:
        raise DatabaseUnavailableError("MongoDB client is not initialized.")
    return _client


def is_db_connected():
    """Return True only after a live ping; raise on failure, never fake success."""
    _ping(_client)
    return True


# Existing routes import handles directly, so initialize before publishing them.
# RuntimeError deliberately propagates through main.py's ImportError fallback.
init_db()
users_collection = _database[COLLECTION_NAMES["users_collection"]]
registered_vehicles_collection = _database[COLLECTION_NAMES["registered_vehicles_collection"]]
detection_logs_collection = _database[COLLECTION_NAMES["detection_logs_collection"]]
parking_status_collection = _database[COLLECTION_NAMES["parking_status_collection"]]
parking_sessions_collection = _database[COLLECTION_NAMES["parking_sessions_collection"]]
parking_spots_collection = _database[COLLECTION_NAMES["parking_spots_collection"]]
user_saved_spots_collection = _database[COLLECTION_NAMES["user_saved_spots_collection"]]
saved_spots_collection = _database[COLLECTION_NAMES["saved_spots_collection"]]
system_settings_collection = _database[COLLECTION_NAMES["system_settings_collection"]]
