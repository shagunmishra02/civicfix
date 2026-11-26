import os
import secrets
import hashlib
import datetime
from typing import Optional, Dict, Any, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# In production or standard deployment, load from environment variable.
# If not supplied, generate a cryptographically strong secret at runtime.
SECRET_KEY = os.getenv("CIVICFIX_JWT_SECRET")
if not SECRET_KEY:
    # Use persistent or environment secret, fallback to generated secret per process session
    _fallback_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".jwt_secret")
    if os.path.exists(_fallback_file):
        with open(_fallback_file, "r") as f:
            SECRET_KEY = f.read().strip()
    else:
        SECRET_KEY = secrets.token_hex(32)
        try:
            with open(_fallback_file, "w") as f:
                f.write(SECRET_KEY)
        except Exception:
            pass

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """PBKDF2 HMAC SHA256 password hashing with salt format: salt$hash"""
    if not salt:
        salt = "civicfix_salt_mody_estate_v2"
    h = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}${h}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        if "$" in stored_hash:
            salt, h = stored_hash.split("$", 1)
            candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
            return secrets.compare_digest(candidate, h)
        else:
            # Backwards compatibility
            old_salt = b"mody_univ_estate_salt_9823"
            candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), old_salt, 100000).hex()
            return secrets.compare_digest(candidate, stored_hash)
    except Exception:
        return False

# Authorized Estate & Maintenance Personnel
# Password hashes stored securely
AUTHORIZED_STAFF: Dict[str, Dict[str, Any]] = {
    "estate.head@modyuniversity.ac.in": {
        "name": "Eng. O.P. Yadav",
        "role": "Chief Estate Officer",
        "department": "Directorate of Estate & Campus Infrastructure",
        "allowed_categories": ["*"],
        "hashed_password": hash_password("Mody@Estate2024!"),
        "permissions": ["all", "triage", "status_update", "assign", "close"]
    },
    "electrical.lead@modyuniversity.ac.in": {
        "name": "Rajesh Sharma",
        "role": "Senior Electrical Supervisor",
        "department": "Electrical Maintenance Division",
        "allowed_categories": ["Streetlights & Electrical"],
        "hashed_password": hash_password("Mody@Power2024!"),
        "permissions": ["triage", "status_update"]
    },
    "civil.lead@modyuniversity.ac.in": {
        "name": "Mahesh Verma",
        "role": "Civil & Roads Inspector",
        "department": "Civil Works & Masonry Section",
        "allowed_categories": ["Roads & Potholes", "Infrastructure & Facilities"],
        "hashed_password": hash_password("Mody@Civil2024!"),
        "permissions": ["triage", "status_update"]
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer: Dict[str, Any]

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (expires_delta or datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "iss": "civicfix-estate-system"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_authorized_officer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Validates JWT Bearer token and verifies authorized personnel status.
    Rejects unauthorized access with 401 Unauthorized.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Denied: Authorization token required. Only authorized Estate staff can perform this action.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email or email not in AUTHORIZED_STAFF:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: Account is not in the Authorized Estate Officers Registry.",
            )
        staff = AUTHORIZED_STAFF[email].copy()
        staff["email"] = email
        return staff
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session Expired: Security token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication Failed: Invalid or forged security token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

