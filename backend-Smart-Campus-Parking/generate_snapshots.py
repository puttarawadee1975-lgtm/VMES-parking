import os

snapshots_dir = os.path.join(os.path.dirname(__file__), "data", "snapshots")
os.makedirs(snapshots_dir, exist_ok=True)

def make_svg_snapshot(filename, title, plate, helmet_status, is_violation=False):
    border_color = "#ef4444" if is_violation else "#10b981"
    badge_bg = "#fef2f2" if is_violation else "#ecfdf5"
    badge_text_color = "#ef4444" if is_violation else "#10b981"
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
  <rect width="600" height="350" fill="#0f172a" />
  
  <!-- CCTV Grid Lines -->
  <line x1="0" y1="70" x2="600" y2="70" stroke="#1e293b" stroke-width="1" />
  <line x1="0" y1="280" x2="600" y2="280" stroke="#1e293b" stroke-width="1" />
  
  <!-- CCTV Header -->
  <text x="20" y="40" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="bold">🔴 CAM-01: GATE 1 MAIN ENTRANCE - AI EVIDENCE SNAPSHOT</text>
  <text x="580" y="40" fill="#64748b" font-family="sans-serif" font-size="12" text-anchor="end">2026-09-07 LIVE</text>

  <!-- Simulated Vehicle Bounding Box -->
  <rect x="150" y="100" width="300" height="170" fill="none" stroke="{border_color}" stroke-width="3" stroke-dasharray="6,4" rx="12" />
  
  <!-- Reticle Corners -->
  <path d="M 140 120 L 140 90 L 170 90" stroke="{border_color}" stroke-width="4" fill="none" />
  <path d="M 460 120 L 460 90 L 430 90" stroke="{border_color}" stroke-width="4" fill="none" />
  <path d="M 140 250 L 140 280 L 170 280" stroke="{border_color}" stroke-width="4" fill="none" />
  <path d="M 460 250 L 460 280 L 430 280" stroke="{border_color}" stroke-width="4" fill="none" />

  <!-- Detected Plate Badge -->
  <rect x="190" y="195" width="220" height="60" fill="#1e293b" stroke="{border_color}" stroke-width="2" rx="10" />
  <text x="300" y="225" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="middle">{plate}</text>
  
  <!-- Helmet Status Pill -->
  <rect x="220" y="235" width="160" height="16" fill="{badge_bg}" rx="4" />
  <text x="300" y="247" fill="{badge_text_color}" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">{helmet_status}</text>
  
  <!-- Footer Banner -->
  <rect x="0" y="310" width="600" height="40" fill="#020617" />
  <text x="20" y="335" fill="#e2e8f0" font-family="sans-serif" font-size="12" font-weight="bold">TYPE: {title}</text>
  <text x="580" y="335" fill="{badge_text_color}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">STATUS: {'VIOLATION DETECTED (-10 PTS)' if is_violation else 'COMPLIANT (PASS)'}</text>
</svg>'''

    filepath = os.path.join(snapshots_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated snapshot: {filepath}")

make_svg_snapshot("ev_violation_no_helmet.svg", "Motorcycle", "1กข 1234 BKK", "FAIL: NO HELMET DETECTED", is_violation=True)
make_svg_snapshot("ev_violation_3gh5678.svg", "Motorcycle", "3กฮ 5678 BKK", "FAIL: NO HELMET DETECTED", is_violation=True)
make_svg_snapshot("ev_pass_helmet_worn.svg", "Motorcycle", "2กข 4321 NBI", "PASS: HELMET WORN", is_violation=False)
make_svg_snapshot("ev_pass_car_entry.svg", "Automobile", "9กข 9999 SPK", "PASS: CAR ENTRY APPROVED", is_violation=False)
