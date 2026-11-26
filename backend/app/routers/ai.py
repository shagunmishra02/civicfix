from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Complaint
from ..schemas import (
    AIClassificationRequest,
    AIClassificationResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    NearbyDuplicate
)
from ..ai_service import ai_engine

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

@router.post("/classify", response_model=AIClassificationResponse)
def classify_complaint_text(payload: AIClassificationRequest):
    """
    Analyzes student complaint text using TF-IDF + Logistic Regression NLP model,
    identifying category, confidence score, urgency priority, and reasoning.
    """
    result = ai_engine.classify_text(payload.text)
    return AIClassificationResponse(**result)


@router.post("/check-duplicates", response_model=DuplicateCheckResponse)
def check_duplicate_issues(payload: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """
    Scans active (non-resolved) complaints within the specified radius (default: 75m).
    Helps prevent duplicate complaint floods by prompting the user to upvote existing issues.
    """
    active_issues = db.query(Complaint).filter(Complaint.status != "Resolved").all()
    nearby: list[NearbyDuplicate] = []

    for issue in active_issues:
        dist = ai_engine.haversine_distance_meters(
            payload.latitude, payload.longitude,
            issue.latitude, issue.longitude
        )
        if dist <= payload.radius_meters:
            # If category is provided, boost match relevance if categories match
            nearby.append(
                NearbyDuplicate(
                    id=issue.id,
                    title=issue.title,
                    category=issue.category,
                    status=issue.status,
                    location_name=issue.location_name,
                    distance_meters=round(dist, 1),
                    upvotes=issue.upvotes
                )
            )

    # Sort closest first
    nearby.sort(key=lambda x: x.distance_meters)

    return DuplicateCheckResponse(
        has_duplicates=len(nearby) > 0,
        count=len(nearby),
        nearby_issues=nearby
    )
