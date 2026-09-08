from fastapi import APIRouter, HTTPException, Depends, status
from schemas import QRCodeVerify
from auth import get_current_user

router = APIRouter(prefix="/verify-qr", tags=["QR Code Verification"])

VALID_QR_CODES = ["MAIN_GATE_ENTRY", "ZONE_A_GATE"]

@router.post("", status_code=status.HTTP_200_OK)
async def verify_qr_code(payload: QRCodeVerify, current_user: dict = Depends(get_current_user)):
    """
    Verify QR Code scanned by the user.
    Requires JWT token (student, officer, office).
    """
    if payload.qr_code_data in VALID_QR_CODES:
        return {
            "status": "success",
            "message": "ยืนยันตัวตนสำเร็จ ได้รับอนุญาตผ่านเข้าพื้นที่",
            "user": current_user.get("name")
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="QR Code ไม่ถูกต้อง หรือไม่มีอยู่ในระบบ"
        )
