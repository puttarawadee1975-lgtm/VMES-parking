from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Vehicle Schema
class Vehicle(BaseModel):
    plate: str = Field(..., description="License plate number, e.g., '1กก1234'")
    type: Literal["car", "motorcycle"] = Field(..., description="Vehicle type: 'car' or 'motorcycle'")

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: Literal["student", "officer", "office"] = "student"
    name: str
    driving_score: int = Field(default=100, ge=0, le=100)
    vehicles: List[Vehicle] = Field(default_factory=list)

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: Optional[str] = None

# Detection Log Schemas
class DetectionLogCreate(BaseModel):
    license_plate: str = Field(..., description="Detected license plate string")
    vehicle_type: Literal["car", "motorcycle"] = Field(..., description="'car' or 'motorcycle'")
    helmet_detected: Optional[bool] = Field(None, description="True/False for motorcycle; None for car")
    gate_type: str = Field(default="ENTRY", description="Gate direction or location e.g. ENTRY or EXIT")
    zone: Optional[str] = Field("Zone A", description="Parking zone associated with the gate")
    violation: Optional[bool] = None  # Computed automatically if omitted
    image_url: Optional[str] = Field(None, description="URL or path to captured CCTV snapshot image")
    timestamp: Optional[datetime] = None

class DetectionLogResponse(DetectionLogCreate):
    id: str
    matched_user: Optional[str] = None

# Driving Score Audit Log Schemas
class DrivingScoreLogCreate(BaseModel):
    user_email: EmailStr
    action: Literal["DEDUCT", "RESTORE"]
    points_changed: int
    new_score: int
    reason: str
    gate_name: Optional[str] = "VMES Entry Gate"
    image_url: Optional[str] = None
    timestamp: Optional[datetime] = None

class DrivingScoreLogResponse(DrivingScoreLogCreate):
    id: str

class QRCodeVerify(BaseModel):
    qr_code_data: str

# Parking Status Schemas
class ParkingStatusUpdate(BaseModel):
    zone: str
    total_slots: int
    occupied_slots: int

class ParkingStatusResponse(BaseModel):
    zone: str
    total_slots: int
    occupied_slots: int
    available_slots: int
    last_updated: datetime

# Saved Spot Schemas
class SavedSpotCreate(BaseModel):
    zone: str = Field(..., description="e.g. Zone A")
    building: str = Field(default="VEMS Building", description="e.g. VEMS Building")
    floor: str = Field(default="Floor G", description="e.g. Floor G")
    pillar: str = Field(..., description="e.g. G05-G09")
    savedDate: Optional[str] = None
    savedTime: Optional[str] = None

class SavedSpotResponse(SavedSpotCreate):
    id: Optional[str] = None
    user_email: Optional[str] = None
    timestamp: datetime

# Auth Schemas
class MicrosoftAuthRequest(BaseModel):
    access_token: Optional[str] = None
    id_token: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Registered Vehicle MongoDB Schema
class VehicleRegisterCreate(BaseModel):
    plate: str
    model: str
    user_email: Optional[str] = None
    role: Optional[str] = "student"
