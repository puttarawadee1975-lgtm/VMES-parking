from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Vehicle Schema
class Vehicle(BaseModel):
    user_id: Optional[str] = Field(None, description="FK linking to User ID")
    plate: str = Field(..., description="License plate number, e.g., '1กข 1234'")
    model: Optional[str] = None
    type: Optional[str] = None
    vehicle_type: Optional[str] = None
    province: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    vehicle_photo_url: Optional[str] = None
    front_photo_url: Optional[str] = None
    side_photo_url: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    user_id: Optional[str] = Field(None, description="Primary Unique User ID")
    email: EmailStr
    role: str = "student"
    name: str
    student_id: Optional[str] = None
    driving_score: int = Field(default=100, ge=0, le=100)
    vehicles: List[dict] = Field(default_factory=list)

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: Optional[str] = None

# Detection Log Schemas
class DetectionLogCreate(BaseModel):
    license_plate: str = Field(..., description="Detected license plate string")
    vehicle_type: Literal["car", "motorcycle"] = Field(..., description="'car' or 'motorcycle'")
    helmet_detected: Optional[bool] = Field(None, description="True/False for motorcycle; None for car")
    camera_id: Optional[str] = Field(None, description="Camera ID e.g. '01' for Entry or '02' for Exit")
    gate_type: Optional[str] = Field(default="ENTRY", description="Gate direction or location e.g. ENTRY or EXIT")
    zone: Optional[str] = Field("-", description="Gate zone")
    violation: Optional[bool] = None  # Computed automatically if omitted
    image_url: Optional[str] = Field(None, description="URL or path to captured CCTV snapshot image")
    snapshot_base64: Optional[str] = Field(None, description="Base64 encoded CCTV image string stored directly in DB")
    timestamp: Optional[datetime] = None


class DetectionLogResponse(DetectionLogCreate):
    id: str
    matched_user: Optional[str] = None
    penalty_applied: Optional[bool] = None
    parking_session_action: Optional[Literal[
        "ENTER", "EXIT", "DUPLICATE", "UNKNOWN_EXIT", "ERROR"
    ]] = None

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
    user_id: Optional[str] = Field(None, description="FK linking to User ID")
    user_email: Optional[str] = None
    zone: str = Field(..., description="e.g. Zone A")
    building: str = Field(default="VMES Building", description="e.g. VMES Building")
    floor: str = Field(default="Floor G", description="e.g. Floor G")
    pillar: str = Field(..., description="e.g. Spot A-01")
    imageUrl: Optional[str] = None
    imageUrls: Optional[List[str]] = None
    savedDate: Optional[str] = None
    savedTime: Optional[str] = None

class SavedSpotResponse(SavedSpotCreate):
    timestamp: Optional[datetime] = None


class SpotReservationCreate(BaseModel):
    user_id: Optional[str] = Field(None, description="FK linking to User ID")
    zone: str = Field(..., description="e.g. Zone A")
    building: str = Field(default="VMES Building", description="e.g. VMES Building")
    floor: str = Field(default="Floor G", description="e.g. Floor G")
    pillar: str = Field(..., description="e.g. Spot A-01")
    durationMinutes: int = Field(default=30, description="Hold duration in minutes")
    plate: Optional[str] = "1AB 8924 BKK"
    user_email: Optional[str] = "65070042@student.university.ac.th"

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
    user_id: Optional[str] = Field(None, description="FK linking to User ID")
    plate: str
    model: str
    user_email: Optional[str] = None
    role: Optional[str] = "student"
    vehicle_photo: Optional[str] = None
    vehicle_front_photo: Optional[str] = None
    vehicle_side_photo: Optional[str] = None
    student_id_photo: Optional[str] = None
    vehicle_photo_url: Optional[str] = None
    front_photo_url: Optional[str] = None
    side_photo_url: Optional[str] = None


