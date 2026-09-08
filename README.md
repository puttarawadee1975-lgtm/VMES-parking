# 🚦 Smart Campus Parking & Safety Enforcement System

ระบบบริหารจัดการที่จอดรถและตรวจจับความปลอดภัยผู้ขับขี่รถจักรยานยนต์ด้วย AI

---

## 📁 โครงสร้างโฟลเดอร์โครงการ (Project Architecture)

โครงการแบ่งออกเป็น **3 โฟลเดอร์หลัก** เพื่อความง่ายในการดูและพัฒนา:

```text
license-plate-demo/
├── 📱 mobile-app/                  # [Mobile App Frontend] โค้ดแอปมือถือ (Expo React Native for iOS/Android)
├── 💻 admin-web/                   # [Admin Web Frontend] โค้ดเว็บผู้ดูแลระบบ (React 19 + Vite Web Console)
└── ⚙️ backend-Smart-Campus-Parking/ # [Backend API & AI] โค้ดรวมระบบ Backend (FastAPI + MongoDB + AI Pipeline)
```

---

## 🚀 วิธีเปิดใช้งานระบบ (Quick Start)

### 1. ⚙️ ระบบ Backend API Server & AI Camera Pipeline
```bash
npm run start:backend
# หรือเข้าโฟลเดอร์ backend:
cd backend-Smart-Campus-Parking
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- **Swagger API Docs**: http://localhost:8000/docs

---

### 2. 💻 ระบบ Admin Web Console (Website)
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
