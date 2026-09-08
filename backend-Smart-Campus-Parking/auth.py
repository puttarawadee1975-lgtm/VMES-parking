import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import jwt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from database import users_collection

load_dotenv()

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-smart-campus-jwt-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # Default 24 hours

security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def verify_microsoft_token(access_token: Optional[str] = None, id_token: Optional[str] = None) -> Dict[str, str]:
    """
    Verifies Microsoft Entra ID token using Microsoft Graph API or decodes ID token.
    Returns extracted user info: {"email": ..., "name": ...}
    """
    # 1. Try Microsoft Graph API with access_token
    if access_token:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0
                )
                if res.status_code == 200:
                    data = res.json()
                    email = data.get("mail") or data.get("userPrincipalName")
                    name = data.get("displayName") or "Campus User"
                    if email:
                        return {"email": email.lower(), "name": name}
        except Exception as e:
            print(f"[AUTH] Graph API verification error: {e}")

    # 2. Try decoding id_token (without signature verification for client-side MSAL or verify unverified claims)
    if id_token:
        try:
            unverified = jwt.decode(id_token, options={"verify_signature": False})
            email = unverified.get("preferred_username") or unverified.get("email") or unverified.get("upn")
            name = unverified.get("name") or "Campus User"
            if email:
                return {"email": email.lower(), "name": name}
        except Exception as e:
            print(f"[AUTH] ID token decode error: {e}")

    return {}

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and authenticate current user from Bearer JWT.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    email: str = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if users_collection is not None:
        user = users_collection.find_one({"email": email.lower()})
        if user:
            user["_id"] = str(user["_id"])
            return user

    # Fallback to payload data if user not in DB (e.g. transient student token)
    return {
        "email": email,
        "role": payload.get("role", "student"),
        "name": payload.get("name", "Unknown"),
        "driving_score": 100,
        "vehicles": []
    }

def require_roles(allowed_roles: List[str]):
    """
    RBAC Dependency factory to enforce role-based access.
    Allowed roles: ['student', 'officer', 'office']
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role", "student")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles {allowed_roles}. Current role: '{user_role}'"
            )
        return current_user
    return role_checker
