from fastapi.staticfiles import StaticFiles

load_dotenv()

# Ensure snapshots directory exists
snapshots_dir = os.path.join(os.path.dirname(__file__), "data", "snapshots")
os.makedirs(snapshots_dir, exist_ok=True)

app = FastAPI(
    title="Smart Campus Parking & Helmet Detection API",
    description="Backend API for Smart Campus Parking, AI Helmet Detection, and Microsoft Entra RBAC",
    version="1.0.0"
)

# Serve evidence snapshots statically
app.mount("/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")

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
