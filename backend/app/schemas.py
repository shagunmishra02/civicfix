from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import datetime

class ComplaintStatusEnum(str, Enum):
    REPORTED = "Reported"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class ComplaintCategoryEnum(str, Enum):
    STREETLIGHTS = "Streetlights & Electrical"
    ROADS = "Roads & Potholes"
    GARBAGE = "Garbage & Sanitation"
    WATER = "Water & Plumbing"
    SAFETY = "Campus Safety & Security"
    INFRASTRUCTURE = "Infrastructure & Facilities"
    OTHER = "Other"

class ComplaintPriorityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class StatusLogOut(BaseModel):
    id: int
    complaint_id: str
    old_status: Optional[str] = None
    new_status: str
    changed_by: str
    note: Optional[str] = None
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[str] = None  # Validated if provided, else AI classifies
    priority: Optional[ComplaintPriorityEnum] = ComplaintPriorityEnum.MEDIUM
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: str = Field(..., min_length=2, max_length=150)
    image_url: Optional[str] = None
    reported_by: Optional[str] = "Anonymous Student"
    is_sensitive: Optional[bool] = False

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        if v is not None and v != "":
            valid_cats = [c.value for c in ComplaintCategoryEnum]
            if v not in valid_cats:
                raise ValueError(f"Invalid category '{v}'. Allowed: {valid_cats}")
        return v

    @field_validator("latitude", "longitude")
    @classmethod
    def validate_campus_coords(cls, v):
        # Prevent extreme out-of-world inputs
        if v == 0.0:
            raise ValueError("Coordinates (0,0) are not permitted on campus.")
        return v


class ComplaintUpdateStatus(BaseModel):
    new_status: ComplaintStatusEnum
    assigned_to: Optional[str] = Field(None, max_length=120)
    admin_notes: Optional[str] = Field(None, max_length=1000)
    resolution_image_url: Optional[str] = None
    changed_by: Optional[str] = "Estate Admin"


class ComplaintOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    latitude: float
    longitude: float
    location_name: str
    image_url: Optional[str] = None
    resolution_image_url: Optional[str] = None
    resolution_notes: Optional[str] = None
    reported_by: str
    upvotes: int
    assigned_to: Optional[str] = None
    ai_confidence: Optional[float] = None
    is_sensitive: bool = False
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    status_logs: List[StatusLogOut] = []

    class Config:
        from_attributes = True


class AIClassificationRequest(BaseModel):
    text: str


class AIClassificationResponse(BaseModel):
    category: str
    confidence: float
    suggested_priority: str
    reasoning: str
    alternative_categories: List[dict] = []


class DuplicateCheckRequest(BaseModel):
    latitude: float
    longitude: float
    category: Optional[str] = None
    radius_meters: Optional[float] = 75.0


class NearbyDuplicate(BaseModel):
    id: str
    title: str
    category: str
    status: str
    location_name: str
    distance_meters: float
    upvotes: int


class DuplicateCheckResponse(BaseModel):
    has_duplicates: bool
    count: int
    nearby_issues: List[NearbyDuplicate] = []


class CategoryStat(BaseModel):
    category: str
    count: int
    percentage: float


class StatusStat(BaseModel):
    status: str
    count: int


class DepartmentStat(BaseModel):
    department: str
    assigned_count: int
    resolved_count: int


class AnalyticsSummary(BaseModel):
    total_complaints: int
    open_count: int
    in_progress_count: int
    resolved_count: int
    critical_count: int
    avg_resolution_hours: float
    category_distribution: List[CategoryStat]
    status_distribution: List[StatusStat]
    department_stats: List[DepartmentStat]
