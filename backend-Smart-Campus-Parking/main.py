import os
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import client, DB_NAME
from routers import auth, qr, parking, officer, admin, detection, notifications, cameras

load_dotenv()

# Ensure snapshots & vehicle_photos directories exist
snapshots_dir = os.path.join(os.path.dirname(__file__), "data", "snapshots")
os.makedirs(snapshots_dir, exist_ok=True)

vehicle_photos_dir = os.path.join(os.path.dirname(__file__), "data", "vehicle_photos")
os.makedirs(vehicle_photos_dir, exist_ok=True)

app = FastAPI(
    title="VMES Parking & Helmet Detection API (Active)",
    description="Backend API for VMES Parking, AI Helmet Detection, and Microsoft Entra RBAC",
    version="1.0.0"
)


# Serve evidence snapshots & vehicle photos statically
app.mount("/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")
app.mount("/vehicle_photos", StaticFiles(directory=vehicle_photos_dir), name="vehicle_photos")


# CORS configuration for Expo React Native & Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(qr.router)
app.include_router(parking.router)
app.include_router(officer.router)
app.include_router(admin.router)
app.include_router(detection.router)
app.include_router(notifications.router)
app.include_router(cameras.router)

@app.on_event("startup")
async def start_background_services():
    """Initial checks on server startup & launch background loops for score resets and 30-day data retention cleanup."""
    # 1. Automatic 3-Term Semester Safety Score Reset
    try:
        from routers.admin import check_and_auto_reset_semester_scores
        check_and_auto_reset_semester_scores()

        async def auto_semester_reset_loop():
            while True:
                await asyncio.sleep(3600)  # Check every 1 hour
                try:
                    check_and_auto_reset_semester_scores()
                except Exception as err:
                    print(f"[AUTO RESET TASK ERROR] {err}")

        asyncio.create_task(auto_semester_reset_loop())
        print("[AUTO RESET] Automatic 3-Term Semester Safety Score Reset service active.")
    except Exception as e:
        print(f"[AUTO RESET STARTUP ERROR] {e}")

    # 2. Automatic 30-Day Gate History & Image Cleanup
    try:
        from cleanup_service import cleanup_old_records_and_images
        cleanup_old_records_and_images(30)

        async def auto_30day_cleanup_loop():
            while True:
                await asyncio.sleep(86400)  # Run once every 24 hours
                try:
                    cleanup_old_records_and_images(30)
                except Exception as err:
                    print(f"[30-DAY RETENTION TASK ERROR] {err}")

        asyncio.create_task(auto_30day_cleanup_loop())
        print("[DATA RETENTION] Automatic 30-Day Gate History & Image Cleanup service active.")
    except Exception as e:
        print(f"[30-DAY RETENTION STARTUP ERROR] {e}")

@app.get("/", tags=["Health"])
async def root():
    db_status = "connected" if client is not None else "disconnected / offline"
    return {
        "status": "online",
        "service": "Smart Campus Parking API",
        "database": db_status,
        "database_name": DB_NAME
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database_connected": client is not None
    }

