import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError, ServerSelectionTimeoutError

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "Smart-Parking")

def get_database_client():
    """
    Initializes and validates MongoDB Atlas connection.
    Includes timeout & helpful IP Whitelist troubleshooting tips.
    """
    if not MONGO_URI:
        print("[DATABASE ERROR] MONGO_URI is not set in environment or .env file!", file=sys.stderr)
        raise ValueError("MONGO_URI environment variable is missing.")

    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )
        # Verify connection immediately via ping
        client.admin.command('ping')
        print(f"[DATABASE] Connected successfully to MongoDB Atlas (DB: '{DB_NAME}')")
        return client
    except ServerSelectionTimeoutError as e:
        print(
            "\n" + "="*70 +
            "\n[DATABASE CONNECTION TIMEOUT / IP WHITELIST ERROR]"
            "\nCould not connect to MongoDB Atlas."
            "\n1. Please check if your IP address is whitelisted in MongoDB Atlas Network Access."
            "\n   (Atlas Dashboard -> Network Access -> Add IP Address / Allow 0.0.0.0/0 for testing)"
            "\n2. Verify your internet connection."
            f"\nError Details: {e}"
            "\n" + "="*70 + "\n",
            file=sys.stderr
        )
        return None
    except ConfigurationError as e:
        print(f"[DATABASE CONFIG ERROR] Invalid MongoDB connection string: {e}", file=sys.stderr)
        return None
    except ConnectionFailure as e:
        print(f"[DATABASE AUTH/CONNECTION FAILURE] Failed to authenticate or connect: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"[DATABASE UNEXPECTED ERROR] {e}", file=sys.stderr)
        return None

# Global client and DB handles
client = get_database_client()
db = client[DB_NAME] if client is not None else None

# Collections
users_collection = db["users"] if db is not None else None
detection_logs_collection = db["detection_logs"] if db is not None else None
parking_status_collection = db["parking_status"] if db is not None else None
saved_spots_collection = db["saved_spots"] if db is not None else None
registered_vehicles_collection = db["registered_vehicles"] if db is not None else None
