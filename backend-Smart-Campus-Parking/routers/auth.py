import re
from fastapi import APIRouter, HTTPException, status
from schemas import MicrosoftAuthRequest, TokenResponse, UserResponse
from database import users_collection
from auth import verify_microsoft_token, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

def determine_role_from_email(email: str) -> str:
    """
    Auto-detect RBAC role from email format:
    - Email prefix starting with 'u' followed by 7 digits (e.g. u6814509@au.edu) -> 'student'
    - Any other email (e.g. john@au.edu, staff@au.edu) -> 'staff' (Faculty / Staff)
    - Default fallback -> 'staff'
    """
    if not email:
        return "guest"
    
    clean_email = email.strip().lower()
    prefix = clean_email.split("@")[0]
    
    # Check u + 7 digits pattern (e.g. u6814509) -> student
    if re.match(r"^u\d{7}$", prefix):
        return "student"
    
    # Any other email format defaults to Faculty / Staff
    return "staff"

@router.post("/microsoft", response_model=TokenResponse)
async def microsoft_login(payload: MicrosoftAuthRequest):
    """
    1. Receives Microsoft Access Token or ID Token from Expo MSAL.
    2. Validates/extracts user email & name from Entra ID.
    3. Auto-assigns RBAC role based on email pattern (u+7digits -> student, others -> staff).
    4. Finds or registers user in MongoDB Atlas.
    5. Issues Smart Campus App JWT Token with RBAC role.
    """
    user_info = await verify_microsoft_token(
        access_token=payload.access_token,
        id_token=payload.id_token
    )

    # Fallback to direct email payload if provided (useful for testing/mocking in dev)
    email = user_info.get("email") or (payload.email.lower() if payload.email else None)
    name = user_info.get("name") or payload.name or "Campus User"

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to extract valid email from Microsoft token or payload."
        )

    # Auto-detect role based on email pattern
    expected_role = determine_role_from_email(email)

    # Search user in MongoDB Atlas
    user = None
    if users_collection is not None:
        user = users_collection.find_one({"email": email})
        if not user:
            # Auto-register new user with pattern-based role
            new_user_doc = {
                "email": email,
                "role": expected_role,
                "name": name,
                "driving_score": 100,
                "vehicles": []
            }
            res = users_collection.insert_one(new_user_doc)
            new_user_doc["_id"] = str(res.inserted_id)
            user = new_user_doc
        else:
            # Sync role if email matches a specific pattern (e.g. u+7digits = student)
            if user.get("role") != expected_role:
                users_collection.update_one({"email": email}, {"$set": {"role": expected_role}})
                user["role"] = expected_role
            user["_id"] = str(user["_id"])
    else:
        # Fallback if DB is temporarily offline
        user = {
            "email": email,
            "role": expected_role,
            "name": name,
            "driving_score": 100,
            "vehicles": []
        }

    # Issue App JWT Token with Role
    token_data = {
        "email": user["email"],
        "role": user["role"],
        "name": user["name"]
    }
    app_jwt = create_access_token(token_data)

    return TokenResponse(
        access_token=app_jwt,
        token_type="bearer",
        user=UserResponse(
            id=str(user.get("_id", "")),
            email=user["email"],
            role=user["role"],
            name=user["name"],
            driving_score=user.get("driving_score", 100),
            vehicles=user.get("vehicles", [])
        )
    )
