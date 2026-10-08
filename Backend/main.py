import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from database import is_db_connected
except Exception:
    raise RuntimeError(
        "Required database initialization failed. Check dependencies and MongoDB configuration."
    ) from None

app = FastAPI(
    title="SafeRide VMES Parking API",
    description="Backend API Service modularized into dedicated Routers for Mobile App and Admin Web",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Snapshots Directory
snapshots_dir = os.path.join(os.path.dirname(__file__), "data", "snapshots")
os.makedirs(snapshots_dir, exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")

# 1. Mount Mobile App Router
try:
    from routers.mobile import router as mobile_router
    app.include_router(mobile_router)
    print("[Mobile App Router] Mounted successfully.")
except Exception:
    raise RuntimeError("Required mobile router failed to load or register.") from None

# 2. Mount Admin Web Router
try:
    from routers.admin import router as admin_router
    app.include_router(admin_router)
    print("[Admin Web Router] Mounted successfully.")
except Exception:
    raise RuntimeError("Required admin router failed to load or register.") from None

# 3. Mount CCTV Cameras Router
try:
    from cameras import router as cameras_router
    app.include_router(cameras_router)
    print("[Cameras Router] Mounted successfully.")
except Exception:
    raise RuntimeError("Required cameras router failed to load or register.") from None

# 4. Mount AI Detection Router
try:
    from detection import router as detection_router
    app.include_router(detection_router)
    print("[AI Detection Router] Mounted successfully.")
except Exception:
    raise RuntimeError("Required detection router failed to load or register.") from None

# 5. Mount QR Parking Spot Router
try:
    from qr import router as qr_router
    app.include_router(qr_router)
    print("[QR Spots Router] Mounted successfully.")
except Exception:
    raise RuntimeError("Required QR router failed to load or register.") from None

@app.get("/")
def home():
    return {
        "message": "SafeRide Backend API is running",
        "database_status": "Connected" if is_db_connected() else "Not Connected (Prepared for future DB connection)"
    }