import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

db_engine = None
db_connected = False

def init_db():
    """Generic Database Initializer - Prepared for future database connection"""
    global db_engine, db_connected
    if not DATABASE_URL:
        db_connected = False
        print("[Database] No DATABASE_URL set. Running on memory data structure.")
        return False
        
    try:
        # Flexible connection initialization when DATABASE_URL is supplied
        # Example using SQLAlchemy:
        # from sqlalchemy import create_engine
        # db_engine = create_engine(DATABASE_URL)
        print(f"[Database] Connecting to: {DATABASE_URL}")
        db_connected = True
        return True
    except Exception as e:
        print(f"[Database Warning] Connection failed: {e}")
        db_connected = False
        return False

# Initialize check on module load
init_db()

def is_db_connected():
    return db_connected
