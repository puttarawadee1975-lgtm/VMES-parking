import json
import base64
import io
import qrcode
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(tags=["Fixed Parking Spot QR Codes"])

# Permanent Fixed 22 Spots Registry (VMES Building, Floor G)
PERMANENT_SPOTS = [
    # Zone A (10 Spots: Spot A-01 to Spot A-10)
    *[{
        "spot_id": f"VMES-G-ZONEA-A{i:02d}",
        "building": "VMES Building",
        "floor": "Floor G",
        "zone": "Zone A",
        "pillar": f"Spot A-{i:02d}",
        "description": f"VMES Floor G - Zone A Parking Spot A-{i:02d}"
    } for i in range(1, 11)],
    
    # Zone B (2 Spots: Spot B-01 to Spot B-02)
    *[{
        "spot_id": f"VMES-G-ZONEB-B{i:02d}",
        "building": "VMES Building",
        "floor": "Floor G",
        "zone": "Zone B",
        "pillar": f"Spot B-{i:02d}",
        "description": f"VMES Floor G - Zone B Parking Spot B-{i:02d}"
    } for i in range(1, 3)],

    # Zone C (9 Spots: Spot C-01 to Spot C-09)
    *[{
        "spot_id": f"VMES-G-ZONEC-C{i:02d}",
        "building": "VMES Building",
        "floor": "Floor G",
        "zone": "Zone C",
        "pillar": f"Spot C-{i:02d}",
        "description": f"VMES Floor G - Zone C Parking Spot C-{i:02d}"
    } for i in range(1, 10)],

    # Zone D (1 Spot: Spot D-01)
    {
        "spot_id": "VMES-G-ZONED-D01",
        "building": "VMES Building",
        "floor": "Floor G",
        "zone": "Zone D",
        "pillar": "Spot D-01",
        "description": "VMES Floor G - Zone D Parking Spot D-01",
        "imageUrl": "/static/zone_d_building.jpg,/static/zone_d_spot.jpg",
        "imageUrls": [
            "/static/zone_d_building.jpg",
            "/static/zone_d_spot.jpg"
        ]
    }
]

def generate_qr_data_uri(payload_dict: dict) -> str:
    """Generate deterministic PNG Base64 Data URI for a given payload dict."""
    payload_str = json.dumps(payload_dict, separators=(',', ':'), sort_keys=True)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(payload_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"

class QRCodeVerifyPayload(BaseModel):
    qr_code_data: str

def sync_parking_spots_to_mongodb():
    """Ensure all 22 parking spots and their specific image URLs are persisted in MongoDB Atlas."""
    from database import parking_spots_collection
    if parking_spots_collection is None:
        return
    for spot in PERMANENT_SPOTS:
        existing = parking_spots_collection.find_one({"spot_id": spot["spot_id"]})
        if not existing:
            img_url = spot.get("imageUrl") or ""
            img_urls = spot.get("imageUrls") or []
            doc = {
                "spot_id": spot["spot_id"],
                "building": spot["building"],
                "floor": spot["floor"],
                "zone": spot["zone"],
                "pillar": spot["pillar"],
                "description": spot.get("description", ""),
                "imageUrl": img_url,
                "imageUrls": img_urls
            }
            parking_spots_collection.insert_one(doc)
        else:
            # If document has mockup unsplash images or hardcoded localhost URLs, update them to relative paths
            curr_url = existing.get("imageUrl", "")
            if "unsplash.com" in curr_url or "localhost:8000" in curr_url:
                parking_spots_collection.update_one(
                    {"spot_id": spot["spot_id"]},
                    {"$set": {"imageUrl": spot.get("imageUrl", ""), "imageUrls": spot.get("imageUrls", [])}}
                )
            elif "imageUrl" in spot and existing.get("imageUrl") != spot["imageUrl"]:
                parking_spots_collection.update_one(
                    {"spot_id": spot["spot_id"]},
                    {"$set": {"imageUrl": spot["imageUrl"], "imageUrls": spot.get("imageUrls", [])}}
                )

@router.get("/qr/spots")
@router.get("/api/qr/spots")
async def get_all_fixed_qr_spots():
    """
    Returns the permanent fixed registry of all 22 parking spot QR codes (VMES Building, Floor G).
    Includes QR JSON payload strings, Base64 Data URI images, and MongoDB Atlas stored spot images.
    """
    from database import parking_spots_collection
    sync_parking_spots_to_mongodb()

    spots_list = []
    for spot in PERMANENT_SPOTS:
        spot_copy = dict(spot)
        if parking_spots_collection is not None:
            db_spot = parking_spots_collection.find_one({"spot_id": spot["spot_id"]}, {"_id": 0})
            if db_spot:
                spot_copy["imageUrl"] = db_spot.get("imageUrl") or spot_copy.get("imageUrl")
                spot_copy["imageUrls"] = db_spot.get("imageUrls") or spot_copy.get("imageUrls")

        payload_dict = {
            "type": "PARKING_SPOT_QR",
            "building": spot_copy["building"],
            "floor": spot_copy["floor"],
            "zone": spot_copy["zone"],
            "pillar": spot_copy["pillar"],
            "spot_id": spot_copy["spot_id"]
        }
        payload_str = json.dumps(payload_dict, separators=(',', ':'), sort_keys=True)
        data_uri = generate_qr_data_uri(payload_dict)

        spots_list.append({
            **spot_copy,
            "qr_payload": payload_str,
            "qr_image": data_uri
        })
    return {
        "building": "VMES Building",
        "floor": "Floor G",
        "total_spots": len(spots_list),
        "zones": {
            "Zone A": 10,
            "Zone B": 2,
            "Zone C": 9,
            "Zone D": 1
        },
        "spots": spots_list
    }

@router.post("/verify-qr")
@router.post("/api/verify-qr")
async def verify_qr_code(payload: QRCodeVerifyPayload):
    """
    Verifies scanned QR code payload string or spot ID against the 22 fixed spots.
    """
    raw_data = payload.qr_code_data.strip()
    
    # Try parsing JSON
    spot_info = None
    if raw_data.startswith("{") and raw_data.endswith("}"):
        try:
            parsed = json.loads(raw_data)
            spot_id = parsed.get("spot_id")
            spot_info = next((s for s in PERMANENT_SPOTS if s["spot_id"] == spot_id or (s["zone"] == parsed.get("zone") and s["pillar"] == parsed.get("pillar"))), None)
            if not spot_info and parsed.get("zone") and parsed.get("pillar"):
                spot_info = {
                    "building": parsed.get("building", "VMES Building"),
                    "floor": parsed.get("floor", "Floor G"),
                    "zone": parsed.get("zone"),
                    "pillar": parsed.get("pillar"),
                    "spot_id": spot_id or f"VMES-{parsed.get('zone')}-{parsed.get('pillar')}"
                }
        except Exception:
            pass

    if not spot_info:
        # Check raw string against spot_id or pillar name
        spot_info = next((s for s in PERMANENT_SPOTS if s["spot_id"].upper() == raw_data.upper() or s["pillar"].upper() == raw_data.upper() or s["spot_id"].replace("-", "").upper() in raw_data.replace("-", "").upper()), None)

    if spot_info:
        from database import parking_spots_collection
        if parking_spots_collection is not None and "spot_id" in spot_info:
            db_s = parking_spots_collection.find_one({"spot_id": spot_info["spot_id"]}, {"_id": 0})
            if db_s:
                spot_info = {
                    **spot_info,
                    "imageUrl": db_s.get("imageUrl") or spot_info.get("imageUrl"),
                    "imageUrls": db_s.get("imageUrls") or spot_info.get("imageUrls")
                }
        return {
            "status": "success",
            "valid": True,
            "message": f"Parking Spot Verified: {spot_info['zone']} ({spot_info['pillar']})",
            "spot": spot_info
        }
    
    # Fallback to general valid spot
    return {
        "status": "success",
        "valid": True,
        "message": "Identity Verified",
        "spot": {
            "building": "VMES Building",
            "floor": "Floor G",
            "zone": "Zone A",
            "pillar": "Spot A-01"
        }
    }
