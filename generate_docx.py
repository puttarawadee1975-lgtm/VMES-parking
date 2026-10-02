import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()

# Set page margins
sections = doc.sections
for section in sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

# Color Palette
PRIMARY = RGBColor(37, 99, 235)      # Royal Blue (#2563eb)
SECONDARY = RGBColor(15, 23, 42)    # Slate 900 (#0f172a)
ACCENT = RGBColor(5, 150, 105)      # Emerald 600 (#059669)
TEXT_DARK = RGBColor(51, 65, 85)     # Slate 700 (#334155)
MUTED = RGBColor(100, 116, 139)     # Slate 500 (#64748b)

def add_title(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.name = 'TH Sarabun Chula'
    run.font.size = Pt(28)
    run.font.bold = True
    run.font.color.rgb = PRIMARY
    p.paragraph_format.space_after = Pt(4)

def add_subtitle(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.name = 'TH Sarabun Chula'
    run.font.size = Pt(16)
    run.font.italic = True
    run.font.color.rgb = MUTED
    p.paragraph_format.space_after = Pt(24)

def add_h1(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'TH Sarabun Chula'
    run.font.size = Pt(20)
    run.font.bold = True
    run.font.color.rgb = PRIMARY
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(8)

def add_h2(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'TH Sarabun Chula'
    run.font.size = Pt(16)
    run.font.bold = True
    run.font.color.rgb = SECONDARY
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)

def add_h3(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'TH Sarabun Chula'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = ACCENT
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)

def add_body(text, bold=False, italic=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'TH Sarabun Chula'
    run.font.size = Pt(14)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = TEXT_DARK
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    return p

def add_bullet(bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    run1 = p.add_run(bold_prefix)
    run1.font.name = 'TH Sarabun Chula'
    run1.font.size = Pt(14)
    run1.font.bold = True
    run1.font.color.rgb = SECONDARY
    
    run2 = p.add_run(text)
    run2.font.name = 'TH Sarabun Chula'
    run2.font.size = Pt(14)
    run2.font.color.rgb = TEXT_DARK
    p.paragraph_format.space_after = Pt(4)

def add_code_box(code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    
    # Background color #f8fafc
    shd = parse_xml(r'<w:shd {} w:fill="f1f5f9"/>'.format(nsdecls('w')))
    cell._tc.get_or_add_tcPr().append(shd)
    
    # Border
    borders = parse_xml(r'''
        <w:tcBorders {} >
            <w:top w:val="single" w:sz="4" w:space="0" w:color="cbd5e1"/>
            <w:left w:val="single" w:sz="18" w:space="0" w:color="2563eb"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="cbd5e1"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="cbd5e1"/>
        </w:tcBorders>
    '''.format(nsdecls('w')))
    cell._tc.get_or_add_tcPr().append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.1)
    run = p.add_run(code_text)
    run.font.name = 'Courier New'
    run.font.size = Pt(10.5)
    run.font.color.rgb = SECONDARY
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_qa_box(question, answer):
    add_h2(f"❓ คำถามอาจารย์: {question}")
    add_body(f"💡 แนวทางการตอบ: {answer}")
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

# ==================== COVER & TITLE ====================
add_title("คู่มืออธิบายสถาปัตยกรรมและโค้ดโปรเจกต์อย่างละเอียด")
add_subtitle("VMES Parking & SafeRide Smart Campus System\nสำหรับเตรียมการนำเสนอและตอบคำถามอาจารย์")

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# ==================== CHAPTER 1 ====================
add_h1("หมวดที่ 1: ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)")

add_body("ระบบ VMES Parking & SafeRide ถูกออกแบบโครงสร้างตามหลักสถาปัตยกรรม client-server แบบ 3-Tier Architecture ที่ใช้เซิร์ฟเวอร์เดียวเป็นจุดศูนย์กลางความถูกต้องของข้อมูล (Single Source of Truth) เพื่อให้ทั้งแอปพลิเคชันมือถือ (Mobile App) และหน้าเว็บผู้ดูแลระบบ (Admin Web) แสดงผลตรงกันตลอดเวลา")

add_h2("องค์ประกอบหลัก 3 ส่วนของระบบ:")
add_bullet("1. Backend Service (FastAPI): ", "ทำหน้าที่เป็นศูนย์กลางประมวลผลคำนวณจำนวนช่องจอด ตรวจสอบสิทธิ์ผู้ใช้ จัดการทะเบียนรถ และประมวลผลกล้อง AI CCTV")
add_bullet("2. Mobile Application (React Native / Expo): ", "แอปพลิเคชันสำหรับนักศึกษา/บุคลากร ใช้ดูสถานะช่องจอดรถ สแกน QR Code บันทึกจุดจอด และลงทะเบียนรถส่วนตัว")
add_bullet("3. Admin Web Dashboard (Vite / React): ", "หน้าเว็บผู้ดูแลระบบสำหรับอาจารย์และเจ้าหน้าที่รักษาความปลอดภัย ใช้ดูภาพรวมสถิติ ตรวจประวัติการผ่านประตู และจัดการประกาศมหาวิทยาลัย")

add_h2("แผนผังการไหลของข้อมูล (Data Flow Diagram):")
add_code_box(
" [ 📱 Mobile App ]               [ 💻 Admin Web ]\n"
"        │                               │\n"
"        │  (HTTP / REST API)            │  (HTTP / REST API)\n"
"        ▼                               ▼\n"
" ┌──────────────────────────────────────────────┐\n"
" │            ☁️ Backend API Server             │\n"
" │             (FastAPI / Python)               │\n"
" └──────────────────────┬───────────────────────┘\n"
"                        │\n"
"       ┌────────────────┴────────────────┐\n"
"       ▼                                 ▼\n"
"┌──────────────┐                 ┌──────────────┐\n"
"│  In-Memory   │                 │   MongoDB    │\n"
"│ (store.py)   │  <--- Sync ---> │  Atlas Cloud │\n"
"└──────────────┘                 └──────────────┘"
)

# ==================== CHAPTER 2 ====================
add_h1("หมวดที่ 2: โครงสร้างและการทำงานของ Backend (FastAPI)")

add_body("โค้ดฝั่ง Backend ถูกจัดโครงสร้างแบบ Modular Clean Architecture โดยใช้ FastAPI APIRouter แยกไฟล์ตามหน้าที่เพื่อให้อ่านและดูแลได้ง่าย:")

add_h2("รายการไฟล์และหน้าที่การทำงานฝั่ง Backend:")

add_h3("1. Backend/main.py (จุดเริ่มต้นระบบ)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 1 - 70")
add_bullet("หน้าที่การทำงาน: ", "ทำหน้าที่เป็น Entry Point หลัก สร้างอินสแตนซ์ FastAPI(), เปิดตั้งค่า CORS Middleware อนุญาตให้ App และ Web เข้าถึงได้, Mount โฟลเดอร์รูปภาพ /snapshots และทำการ Include Router ย่อยทั้งหมดเข้าด้วยกัน")
add_code_box(
"# Backend/main.py\n"
"app = FastAPI(title='SafeRide VMES Parking API')\n"
"app.include_router(mobile_router)  # สตรีม API ฝั่ง Mobile App\n"
"app.include_router(admin_router)   # สตรีม API ฝั่ง Admin Web\n"
"app.include_router(cameras_router) # สตรีม API กล้อง CCTV\n"
"app.include_router(detection_router) # สตรีม API ตรวจจับป้ายทะเบียน AI"
)

add_h3("2. Backend/store.py (คลังข้อมูลและความจุช่องจอด)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 166 - 209")
add_bullet("หน้าที่การทำงาน: ", "จัดเก็บโครงสร้างข้อมูลความจุช่องจอดรถ (parking_status_memory) และมีฟังก์ชัน update_in_memory_parking_status() คำนวณเพิ่ม/ลดจำนวนรถเมื่อขับผ่านประตู")
add_code_box(
"# Backend/store.py (บรรทัด 166-209)\n"
"parking_status_memory = [\n"
"    { 'zone': 'Zone A', 'total_slots': 10, 'occupied_slots': 2, 'available_slots': 8 },\n"
"    { 'zone': 'Zone B', 'total_slots': 0,  'occupied_slots': 4, 'available_slots': 0 },\n"
"    { 'zone': 'Zone C', 'total_slots': 8,  'occupied_slots': 1, 'available_slots': 7 },\n"
"    { 'zone': 'Zone D', 'total_slots': 0,  'occupied_slots': 2, 'available_slots': 0 }\n"
"]\n\n"
"def update_in_memory_parking_status(zone_name, gate_type):\n"
"    if gate_type == 'ENTRY': occupied_slots += 1\n"
"    elif gate_type == 'EXIT': occupied_slots -= 1\n"
"    available_slots = total_slots - occupied_slots"
)

add_h3("3. Backend/routers/mobile.py (API สำหรับ Mobile App)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 11 - 210")
add_bullet("หน้าที่การทำงาน: ", "ประกอบด้วย Endpoints สำคัญของฝั่งแอป ได้แก่:\n"
"- POST /parking/save-spot (บรรทัด 11-58): รับพิกัดสแกน QR บันทึกจุดจอดส่วนตัว\n"
"- GET /parking/get-spot (บรรทัด 60-80): ส่งพิกัดจุดจอดที่เคยสแกนไว้คืนให้แอปไปแสดงบนการ์ด Find My Parking\n"
"- GET /parking/status (บรรทัด 196-198): ส่ง JSON จำนวนช่องจอดรถว่างอัปเดตล่าสุดออกไป")

add_h3("4. Backend/routers/admin.py (API สำหรับ Admin Web)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 10 - 240")
add_bullet("หน้าที่การทำงาน: ", "ประกอบด้วย Endpoints สำคัญของฝั่งเว็บผู้ดูแลระบบ ได้แก่:\n"
"- GET /admin/dashboard (บรรทัด 20-55): คืนค่าสถิติยอดสแกน ความหนาแน่น และประวัติการสวมหมวกกันน็อก\n"
"- GET /admin/all-vehicles (บรรทัด 90-100): คืนค่าไดเรกทอรีรายการรถยนต์ที่ลงทะเบียนในระบบทั้งหมด\n"
"- GET /admin/announcements (บรรทัด 190-220): คืนค่ารายการประกาศของมหาวิทยาลัย")

add_h3("5. Backend/detection.py (กล้อง AI ตรวจจับป้ายทะเบียน)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 450 - 520")
add_bullet("หน้าที่การทำงาน: ", "ประมวลผลรูปภาพและสตรีมวิดีโอจากกล้องทางเข้า/ออกด้วยโมเดล YOLOv8 เพื่อแยกทะเบียนรถและเช็กสวมหมวกกันน็อก จากนั้นสั่งอัปเดตบวกลบที่จอดลงใน store.py ทันที")

# ==================== CHAPTER 3 ====================
add_h1("หมวดที่ 3: โครงสร้างและการทำงานของ Mobile App (React Native / Expo)")

add_body("ฝั่งแอปพลิเคชันมือถือถูกเขียนขึ้นด้วย React Native + Expo Tailwind โดยมีโครงสร้างหลักดังนี้:")

add_h2("รายการไฟล์และหน้าที่การทำงานฝั่ง Mobile App:")

add_h3("1. mobile-app/src/services/api.js (ศูนย์รวมคำสั่งส่ง API)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 1 - 75")
add_bullet("หน้าที่การทำงาน: ", "กำหนดตัวแปร API_BASE_URL (บรรทัด 1-2) และฟังก์ชัน fetchAPI() (บรรทัด 38-72) ที่มีระบบค้นหา IP เครื่องเซิร์ฟเวอร์แบบอัตโนมัติ (candidateHosts) ทำให้แอปต่อ Backend ได้ราบรื่นไม่หลุด")

add_h3("2. mobile-app/src/screens/StudentHomeScreen.js (หน้าแรกนักศึกษา)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 30 - 180")
add_bullet("หน้าที่การทำงาน: ", "ดึงข้อมูลที่จอดรถว่างผ่าน getParkingStatus() มาแสดงบนการ์ดขนาดใหญ่ (บรรทัด 166-170) และตั้งคำสั่ง setInterval(fetchParkingData, 5000) คอยดึงตัวเลขใหม่ทุกๆ 5 วินาที")

add_h3("3. mobile-app/src/screens/QRScanScreen.js (หน้าสแกน QR Code)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 46 - 112")
add_bullet("หน้าที่การทำงาน: ", "เปิดกล้องสแกน QR Code ประจำเสาจอดรถ เมื่อสแกนได้จะถอดรหัสพิกัดจุดจอด แล้วยิง POST /parking/save-spot ไปเซฟที่ Backend เพื่อนำกลับมาแสดงในหน้าแรก")

# ==================== CHAPTER 4 ====================
add_h1("หมวดที่ 4: โครงสร้างและการทำงานของ Admin Web (React / Vite)")

add_body("ฝั่งหน้าเว็บผู้ดูแลระบบถูกพัฒนาด้วย React + TailwindCSS สำหรับให้อาจารย์และเจ้าหน้าที่ดูสถิติ:")

add_h2("รายการไฟล์และหน้าที่การทำงานฝั่ง Admin Web:")

add_h3("1. admin-web/src/api.js (ศูนย์รวมการดึง API ฝั่งเว็บ)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 1 - 30")
add_bullet("หน้าที่การทำงาน: ", "กำหนด API_BASE_URL และมีฟังก์ชัน getApiHost() คอยเช็กว่าหน้าเว็บรันอยู่บนพอร์ตไหน แล้วยิงคำขอไปที่ Backend พอร์ต 8000 อัตโนมัติ")

add_h3("2. admin-web/src/App.jsx (ศูนย์ควบคุมหลักฝั่งเว็บ)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 290 - 315")
add_bullet("หน้าที่การทำงาน: ", "ยิงเรียก /parking/status เพื่อดึงตัวเลขที่จอดรถว่างมาคำนวณ % ความหนาแน่น (Occupancy Rate) แล้วกระจายข้อมูลไปแสดงในทุก Tab")

add_h3("3. admin-web/src/components/ParkingOccupancyView.jsx (หน้าจัดการความจุที่จอดรถ)")
add_bullet("ตำแหน่งบรรทัดสำคัญ: ", "บรรทัด 426 - 450")
add_bullet("หน้าที่การทำงาน: ", "คำนวณจำนวนช่องจอดรถยนต์ที่ว่างจริง (availableCarSpots = totalCarCapacity - occupiedCarsCount) และโชว์ตารางผังเสา A-01 ถึง D-01 แบบ Real-time")

# ==================== CHAPTER 5 ====================
add_h1("หมวดที่ 5: แนวทางการตอบคำถามอาจารย์ (Q&A for Presentation)")

add_qa_box(
    "1. ระบบนี้ซิงก์ข้อมูลที่จอดรถว่างระหว่าง App และ Web ให้ตรงกันได้อย่างไร?",
    "ตอบ: ระบบใช้หลักการ Single Source of Truth โดยทั้ง App และ Web ไม่ได้คิดตัวเลขเอง แต่จะยิง HTTP GET Request ไปยัง Endpoint เดียวกันที่ Backend คือ 'GET /parking/status' (ไฟล์ Backend/routers/mobile.py บรรทัด 196) ทำให้ทั้งสองฝั่งอ่านตัวเลขจากคลังข้อมูลเดียวกัน (store.py) จึงแสดงผลตรงกัน 100% เสมอครับ"
)

add_qa_box(
    "2. การสแกน QR Code เพื่อบันทึกที่จอด (Save Spot) ทำให้จำนวนที่จอดรถว่างถูกหักลบซ้ำหรือไม่?",
    "ตอบ: ไม่หักซ้ำครับ เพราะการหักลบจำนวนที่จอดจะเกิดขึ้นเฉพาะตอนกล้อง AI ตรวจจับรถขับผ่านประตูทางเข้า (Gate Entry) ในไฟล์ Backend/detection.py เท่านั้น ส่วนการสแกน QR Code ในไฟล์ Backend/routers/mobile.py (บรรทัด 11-39) ทำหน้าที่เพียงแค่จดจำตำแหน่งที่จอดส่วนตัว (Find My Car) ไม่ได้มีคำสั่งสั่งหักลบจำนวนที่จอดซ้ำอีกรอบครับ"
)

add_qa_box(
    "3. เมื่อเปลี่ยนย้ายระบบจาก Local ไปขึ้นบน AWS โครงสร้างระบบจะเปลี่ยนไปอย่างไร?",
    "ตอบ: โครงสร้างโค้ดทั้งหมดคงเดิม 100% ครับ เพียงแค่ย้ายโค้ด Backend ขึ้นไปรันบน AWS EC2/App Runner แล้วเปลี่ยนค่าตัวแปร API_BASE_URL ในไฟล์ mobile-app/src/services/api.js (บรรทัด 2) และ admin-web/src/api.js (บรรทัด 2) ให้ชี้ไปที่ Domain/IP ของ AWS เท่านั้น ทั้ง App และ Web ก็จะทำงานบน Cloud ได้ทันทีครับ"
)

output_path = "/Users/cheriea/Desktop/license-plate-demo/VMES_Parking_System_Documentation.docx"
doc.save(output_path)
print(f"Successfully generated docx at {output_path}")
