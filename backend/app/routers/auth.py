import time
from fastapi import APIRouter, HTTPException, Depends, status, Request
from ..auth import (
    LoginRequest,
    LoginResponse,
    AUTHORIZED_STAFF,
    verify_password,
    create_access_token,
    get_current_authorized_officer
)

router = APIRouter(prefix="/api/auth", tags=["Security & Staff Authentication"])

# Simple in-memory rate limiting for login attempts per IP
# (prevents brute-force dictionary attacks)
FAILED_ATTEMPTS = {}
LOCKOUT_DURATION = 300  # 5 minutes
MAX_ATTEMPTS = 5

@router.post("/login", response_model=LoginResponse)
def login_estate_staff(payload: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Check lockout
    attempts_info = FAILED_ATTEMPTS.get(client_ip, {"count": 0, "last_attempt": 0, "locked_until": 0})
    if attempts_info["locked_until"] > now:
        remaining = int(attempts_info["locked_until"] - now)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Temporarily locked out for {remaining} seconds."
        )

    email = payload.email.strip().lower()
    if email not in AUTHORIZED_STAFF:
        # Record failed attempt
        attempts_info["count"] += 1
        attempts_info["last_attempt"] = now
        if attempts_info["count"] >= MAX_ATTEMPTS:
            attempts_info["locked_until"] = now + LOCKOUT_DURATION
        FAILED_ATTEMPTS[client_ip] = attempts_info
        time.sleep(0.5)  # Anti-timing attack
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Denied: Unrecognized credentials. Authorized Estate staff only."
        )

    staff = AUTHORIZED_STAFF[email]
    if not verify_password(payload.password, staff["hashed_password"]):
        attempts_info["count"] += 1
        attempts_info["last_attempt"] = now
        if attempts_info["count"] >= MAX_ATTEMPTS:
            attempts_info["locked_until"] = now + LOCKOUT_DURATION
        FAILED_ATTEMPTS[client_ip] = attempts_info
        time.sleep(0.5)  # Anti-timing attack
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Denied: Invalid security passcode."
        )

    # Success: reset failed attempts
    if client_ip in FAILED_ATTEMPTS:
        del FAILED_ATTEMPTS[client_ip]

    # Generate JWT token with roles and allowed categories
    token = create_access_token(data={
        "sub": email,
        "name": staff["name"],
        "role": staff["role"],
        "department": staff["department"],
        "permissions": staff.get("permissions", []),
        "allowed_categories": staff.get("allowed_categories", ["*"])
    })

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        officer={
            "email": email,
            "name": staff["name"],
            "role": staff["role"],
            "department": staff["department"]
        }
    )

@router.get("/me")
def get_current_user_profile(officer: dict = Depends(get_current_authorized_officer)):
    """
    Returns verified officer details from the decoded JWT token.
    """
    return {
        "authenticated": True,
        "officer": {
            "email": officer["email"],
            "name": officer["name"],
            "role": officer["role"],
            "department": officer["department"],
            "permissions": officer.get("permissions", []),
            "allowed_categories": officer.get("allowed_categories", ["*"])
        }
    }

@router.get("/directory")
def get_authorized_directory(officer: dict = Depends(get_current_authorized_officer)):
    """
    Protected directory of authorized Estate departments for internal verification.
    Requires authentication to prevent public email harvesting.
    """
    return [
        {
            "department": data["department"],
            "designation": data["role"],
            "official_email": email
        }
        for email, data in AUTHORIZED_STAFF.items()
    ]
