import os
import uuid
import datetime
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..database import get_db
from ..models import Complaint, StatusLog
from ..schemas import ComplaintCreate, ComplaintOut, ComplaintUpdateStatus
from ..ai_service import ai_engine
from ..auth import get_current_authorized_officer

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

import os
import uuid
import datetime
import shutil
import random
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..database import get_db
from ..models import Complaint, StatusLog, ComplaintUpvote
from ..schemas import ComplaintCreate, ComplaintOut, ComplaintUpdateStatus, ComplaintStatusEnum
from ..ai_service import ai_engine
from ..auth import get_current_authorized_officer

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

def generate_ticket_id(db: Session) -> str:
    # Generate 6-digit collision-resistant code e.g. CF-104928
    for _ in range(25):
        random_num = random.randint(100000, 999999)
        candidate_id = f"CF-{random_num}"
        if not db.query(Complaint).filter(Complaint.id == candidate_id).first():
            return candidate_id
    # Fallback to high-entropy timestamp suffix
    return f"CF-{int(get_utc_now().timestamp()) % 1000000}"

@router.get("", response_model=List[ComplaintOut])
def get_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    include_sensitive: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Privacy filter: omit sensitive tickets from public feed unless explicitly requested (e.g., admin)
    if not include_sensitive:
        query = query.filter(Complaint.is_sensitive == False)

    if status and status != "All":
        query = query.filter(Complaint.status == status)
    if category and category != "All":
        query = query.filter(Complaint.category == category)
    if priority and priority != "All":
        query = query.filter(Complaint.priority == priority)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_pattern),
                Complaint.description.ilike(search_pattern),
                Complaint.location_name.ilike(search_pattern),
                Complaint.id.ilike(search_pattern)
            )
        )

    complaints = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()

    # Mask student identity for public privacy
    for c in complaints:
        if c.reported_by and c.reported_by != "Anonymous Student":
            # Show first name or anonymous indicator to protect student privacy
            parts = c.reported_by.split()
            c.reported_by = f"{parts[0]} (Student)" if len(parts) > 0 else "Student"

    return complaints


@router.post("", response_model=ComplaintOut)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    ticket_id = generate_ticket_id(db)

    # If category or priority is not explicitly provided, run AI text classification
    category = data.category
    priority = (data.priority.value if hasattr(data.priority, "value") else data.priority) or "Medium"
    confidence = None

    if not category or category.strip() == "":
        full_text = f"{data.title}. {data.description}"
        ai_res = ai_engine.classify_text(full_text)
        category = ai_res["category"]
        confidence = ai_res["confidence"]
        if priority == "Medium" or not priority:
            priority = ai_res["suggested_priority"]

    # Auto-flag campus safety issues that mention security vulnerabilities as sensitive
    is_sensitive = data.is_sensitive or False
    lower_desc = (data.title + " " + data.description).lower()
    if any(k in lower_desc for k in ["boundary wall", "panic alarm", "guard booth", "harassment", "cctv broken", "stalking"]):
        is_sensitive = True

    now_utc = get_utc_now()
    complaint = Complaint(
        id=ticket_id,
        title=data.title,
        description=data.description,
        category=category,
        priority=priority,
        status="Reported",
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=data.location_name,
        image_url=data.image_url,
        reported_by=data.reported_by or "Anonymous Student",
        is_sensitive=is_sensitive,
        upvotes=1,
        ai_confidence=confidence,
        created_at=now_utc,
        updated_at=now_utc
    )

    db.add(complaint)

    # Initial timeline entry
    log = StatusLog(
        complaint_id=ticket_id,
        old_status=None,
        new_status="Reported",
        changed_by="Citizen Portal",
        note="Issue filed and registered in University Maintenance System",
        timestamp=now_utc
    )
    db.add(log)

    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id.upper()).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")
    return complaint


@router.post("/{complaint_id}/upvote", response_model=ComplaintOut)
def upvote_complaint(complaint_id: str, request: Request, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id.upper()).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    client_ip = request.client.host if request.client else "anonymous-voter"

    # Enforce 1 upvote per device/voter_token to prevent spamming priority
    existing = db.query(ComplaintUpvote).filter(
        ComplaintUpvote.complaint_id == complaint.id,
        ComplaintUpvote.voter_token == client_ip
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already endorsed/upvoted this issue.")

    new_upvote = ComplaintUpvote(
        complaint_id=complaint.id,
        voter_token=client_ip,
        created_at=get_utc_now()
    )
    db.add(new_upvote)

    complaint.upvotes += 1
    # Controlled auto-escalation
    if complaint.upvotes >= 15 and complaint.priority == "Medium":
        complaint.priority = "High"
    elif complaint.upvotes >= 30 and complaint.priority == "High":
        complaint.priority = "Critical"

    db.commit()
    db.refresh(complaint)
    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def update_complaint_status(
    complaint_id: str,
    data: ComplaintUpdateStatus,
    officer: dict = Depends(get_current_authorized_officer),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id.upper()).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    # RBAC Enforcement: check category permissions
    allowed_cats = officer.get("allowed_categories", ["*"])
    if "*" not in allowed_cats and complaint.category not in allowed_cats:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission Denied: Your division ({officer.get('department')}) is not authorized to triage or resolve '{complaint.category}' tickets."
        )

    new_status_val = data.new_status.value if hasattr(data.new_status, "value") else data.new_status
    old_status = complaint.status
    complaint.status = new_status_val
    now_utc = get_utc_now()
    complaint.updated_at = now_utc

    if data.assigned_to:
        complaint.assigned_to = data.assigned_to
    if data.admin_notes:
        complaint.resolution_notes = data.admin_notes
    if data.resolution_image_url:
        complaint.resolution_image_url = data.resolution_image_url

    # Timestamp management: set resolved_at when Resolved, clear when reopened
    if new_status_val == "Resolved":
        complaint.resolved_at = now_utc
    elif old_status == "Resolved" and new_status_val != "Resolved":
        complaint.resolved_at = None

    # Append audit log recording the verified officer
    officer_label = f"{officer['name']} ({officer['role']})"
    log = StatusLog(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status_val,
        changed_by=officer_label,
        note=data.admin_notes or f"Status transitioned from {old_status} to {new_status_val}",
        timestamp=now_utc
    )
    db.add(log)

    db.commit()
    db.refresh(complaint)
    return complaint


from io import BytesIO
from PIL import Image

# Max upload size: 5 MB
MAX_FILE_SIZE = 5 * 1024 * 1024

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images allowed")

    # Read contents and verify file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed photo size is 5 MB.")

    if len(contents) < 16:
        raise HTTPException(status_code=400, detail="Invalid empty or truncated image file.")

    # Cryptographic/Format verification using Pillow
    try:
        image = Image.open(BytesIO(contents))
        image.verify()  # Verifies image header and integrity without running code
        # Confirm detected format matches allowed raster types
        if image.format.lower() not in ["jpeg", "png", "webp"]:
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid JPEG, PNG, or WEBP image.")
    except Exception:
        raise HTTPException(status_code=400, detail="File verification failed. Please upload a real image.")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(contents)

    return {"url": f"/uploads/{filename}", "filename": filename}
