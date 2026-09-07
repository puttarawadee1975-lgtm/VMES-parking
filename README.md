# 🚦 Smart Campus Parking & Safety Enforcement System

ระบบบริหารจัดการที่จอดรถและตรวจจับความปลอดภัยผู้ขับขี่รถจักรยานยนต์ด้วย AI

---

## 📁โครงสร้างโฟลเดอร์โครงการ (Project Architecture)

โครงการแบ่งออกเป็น 3 ส่วนหลักเพื่อให้ง่ายต่อการดูและพัฒนา:

```text
license-plate-demo/
├── 📱 mobile-app/                  # แอปพลิเคชันมือถือ (Expo React Native for iOS / Android)
├── 💻 admin-web/                   # เว็บไซต์ระบบควบคุม Admin (React 19 + Vite Web Console)
└── ⚙️ backend-Smart-Campus-Parking/ # ระบบ Backend API Server (FastAPI + MongoDB + AI Pipeline)
```

---

## 🚀 วิธีเปิดใช้งานระบบ (Quick Start)

คุณสามารถเปิดใช้งานแต่ละส่วนได้อย่างง่ายดายจาก Root Directory หรือเข้าโฟลเดอร์ของแต่ละส่วน:

### 1. ⚙️ ระบบ Backend API Server (FastAPI)
```bash
npm run start:backend
# หรือเข้าโฟลเดอร์ backend:
cd backend-Smart-Campus-Parking
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- **Swagger API Docs**: http://localhost:8000/docs

---

### 2. 💻 ระบบ Admin Web Console (React Website)
```bash
npm run start:admin
# หรือเข้าโฟลเดอร์ admin-web:
cd admin-web
npm run dev
```
- **Admin Portal**: http://localhost:3001 (หรือ http://localhost:3000)

---

### 3. 📱 แอปพลิเคชันมือถือ (Mobile App - Expo)
```bash
npm run start:mobile
# หรือเข้าโฟลเดอร์ mobile-app:
cd mobile-app
npx expo start
```

---

## 🌟 ฟีเจอร์หลักของระบบ (System Features)
- **AI License Plate OCR & Helmet Detection**: ตรวจจับทะเบียนและหมวกกันน็อกด้วย YOLOv8 + EasyOCR
- **1 User - 1 Registered Plate Policy**: กฎการลงทะเบียน 1 ทะเบียนรถต่อ 1 บัญชีผู้ใช้
- **100-Point Driving Safety Score**: คะแนนความประพฤติผู้ขับขี่พร้อมระบบหักคะแนนอัตโนมัติเมื่อไม่สวมหมวก
- **Real-Time CCTV Gate Surveillance**: ระบบเฝ้าระวังกล้องวงจรปิด 2 ฝั่ง (ENTRY & EXIT) บนเว็บ Admin
- **MongoDB Data Persistence**: บันทึกข้อมูลทะเบียน ผู้ใช้ ประวัติสแกน และคะแนนความประพฤติลง MongoDB
