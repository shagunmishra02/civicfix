import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(20), primary_key=True, index=True)  # e.g. "CF-10248"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    priority = Column(String(20), default="Medium", index=True)  # Low, Medium, High, Critical
    status = Column(String(30), default="Reported", index=True)  # Reported, Assigned, In Progress, Resolved

    # Geospatial location on campus
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(150), nullable=False)

    # Photos
    image_url = Column(String(500), nullable=True)
    resolution_image_url = Column(String(500), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Citizen / Student metadata & privacy
    reported_by = Column(String(100), default="Anonymous Student")
    is_sensitive = Column(Boolean, default=False, index=True)  # Sensitive security issues hidden from public map
    upvotes = Column(Integer, default=1)

    # Estate Authority Assignment
    assigned_to = Column(String(100), nullable=True)  # e.g. "Electrical Maintenance Division"
    ai_confidence = Column(Float, nullable=True)  # e.g. 0.94

    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship to timeline/audit events & upvotes
    status_logs = relationship("StatusLog", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusLog.timestamp.desc()")
    upvote_records = relationship("ComplaintUpvote", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintUpvote(Base):
    __tablename__ = "complaint_upvotes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(20), ForeignKey("complaints.id"), nullable=False, index=True)
    voter_token = Column(String(100), nullable=False, index=True)  # IP or client fingerprint
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    complaint = relationship("Complaint", back_populates="upvote_records")

    __table_args__ = (
        UniqueConstraint("complaint_id", "voter_token", name="uq_complaint_voter"),
    )


class StatusLog(Base):
    __tablename__ = "status_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(20), ForeignKey("complaints.id"), nullable=False, index=True)
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    changed_by = Column(String(100), default="Admin")
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)

    complaint = relationship("Complaint", back_populates="status_logs")
