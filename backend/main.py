import datetime
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
import jwt
from pymongo import MongoClient

app = FastAPI(title="Smart Parking & Helmet Detection System")

# --- 1. เชื่อมต่อ MongoDB Atlas ---
# ใส่ Connection String ของคุณ
MONGO_URI = "mongodb+srv://puttarawadee1975_db_user:aG5QdDPrNreGc1PL@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["parking_system"]
users_collection = db["role"]

# --- 2. การตั้งค่า JWT Token ---
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_HERE"  # ควรเปลี่ยนเป็นคีย์ลับที่ปลอดภัย
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# --- 3. Schemas สำหรับ Request/Response ---
class LoginRequest(BaseModel):
  email: EmailStr


class LoginResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  role: str
  name: str


# --- 4. ฟังก์ชันตรวจสอบ Token & สิทธิ์ (RBAC) ---
def get_current_user(token: str = Depends(oauth2_scheme)):
  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload  # มีข้อมูล {"email": "...", "role": "..."}
  except Exception:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token ไม่ถูกต้อง หรือหมดอายุ",
    )


def require_roles(allowed_roles: list):
  def role_checker(user: dict = Depends(get_current_user)):
    if user.get("role") not in allowed_roles:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Permission Denied)",
      )
    return user

  return role_checker


# ==========================================
# 5. Endpoint สำหรับ Login ด้วย Email
# ==========================================
@app.post("/login", response_model=LoginResponse)
def login_with_email(req: LoginRequest):
  # ค้นหาอีเมลใน MongoDB Atlas
  user = users_collection.find_one({"email": req.email.lower()})

  # หากไม่พบอีเมลในระบบ
  if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="ไม่พบอีเมลนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ",
    )

  # ดึงข้อมูล Role และชื่อผู้ใช้จาก MongoDB
  role = user.get("role", "student")
  name = user.get("name", "User")

  # สร้าง JWT Token โดยผูก Role เข้าไปด้วย (อายุ 24 ชั่วโมง)
  expire = datetime.datetime.now(
      datetime.timezone.utc
  ) + datetime.timedelta(hours=24)
  payload = {
      "email": user["email"],
      "role": role,
      "exp": expire,
  }
  token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

  return LoginResponse(access_token=token, role=role, name=name)


# ==========================================
# 6. Endpoints ตัวอย่างตามระดับสิทธิ์ (3 Roles)
# ==========================================


# สิทธิ์: student, officer, office (ทุกคนเข้าดูสถานะที่จอดรถได้)
@app.get(
    "/parking/status",
    dependencies=[Depends(require_roles(["student", "officer", "office"]))],
)
def get_parking_status():
  # ดึงข้อมูลที่จอดรถล่าสุด
  status_data = db.parking_status.find_one({}, {"_id": 0})
  return status_data or {"message": "ไม่มีข้อมูลสถานะที่จอดรถ"}


# สิทธิ์: officer, office (ดูบันทึกตรวจจับทะเบียน/หมวก)
@app.get(
    "/officer/detections",
    dependencies=[Depends(require_roles(["officer", "office"]))],
)
def get_detection_logs():
  logs = list(db.detection_logs.find({}, {"_id": 0}).limit(20))
  return logs


# สิทธิ์: office (Admin เท่านั้น)
@app.get("/admin/users", dependencies=[Depends(require_roles(["office"]))])
def get_all_users():
  users = list(db.users.find({}, {"_id": 0, "password": 0}))
  return users