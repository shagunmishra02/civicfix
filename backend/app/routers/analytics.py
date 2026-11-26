from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Complaint
from ..schemas import AnalyticsSummary, CategoryStat, StatusStat, DepartmentStat

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    if total == 0:
        return AnalyticsSummary(
            total_complaints=0,
            open_count=0,
            in_progress_count=0,
            resolved_count=0,
            critical_count=0,
            avg_resolution_hours=0.0,
            category_distribution=[],
            status_distribution=[],
            department_stats=[]
        )

    # Counts
    open_cnt = db.query(Complaint).filter(Complaint.status == "Reported").count()
    assigned_cnt = db.query(Complaint).filter(Complaint.status == "Assigned").count()
    in_prog_cnt = db.query(Complaint).filter(Complaint.status == "In Progress").count()
    resolved_cnt = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    critical_cnt = db.query(Complaint).filter(Complaint.priority == "Critical").count()

    # Category breakdown
    cat_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    category_distribution = [
        CategoryStat(
            category=cat,
            count=cnt,
            percentage=round((cnt / total) * 100, 1)
        )
        for cat, cnt in cat_counts
    ]
    category_distribution.sort(key=lambda x: x.count, reverse=True)

    # Status breakdown
    status_distribution = [
        StatusStat(status="Reported", count=open_cnt),
        StatusStat(status="Assigned", count=assigned_cnt),
        StatusStat(status="In Progress", count=in_prog_cnt),
        StatusStat(status="Resolved", count=resolved_cnt),
    ]

    # Calculate average resolution time (in hours)
    resolved_issues = (
        db.query(Complaint)
        .filter(Complaint.status == "Resolved", Complaint.resolved_at.isnot(None))
        .all()
    )
    if resolved_issues:
        total_hours = sum(
            (issue.resolved_at - issue.created_at).total_seconds() / 3600.0
            for issue in resolved_issues
        )
        avg_res_hours = round(total_hours / len(resolved_issues), 1)
    else:
        avg_res_hours = 0.0

    # Department statistics
    dept_rows = (
        db.query(Complaint.assigned_to, Complaint.status)
        .filter(Complaint.assigned_to.isnot(None))
        .all()
    )
    dept_map = {}
    for dept, status in dept_rows:
        if dept not in dept_map:
            dept_map[dept] = {"assigned": 0, "resolved": 0}
        dept_map[dept]["assigned"] += 1
        if status == "Resolved":
            dept_map[dept]["resolved"] += 1

    department_stats = [
        DepartmentStat(
            department=dept,
            assigned_count=data["assigned"],
            resolved_count=data["resolved"]
        )
        for dept, data in dept_map.items()
    ]
    department_stats.sort(key=lambda x: x.assigned_count, reverse=True)

    return AnalyticsSummary(
        total_complaints=total,
        open_count=open_cnt,
        in_progress_count=assigned_cnt + in_prog_cnt,
        resolved_count=resolved_cnt,
        critical_count=critical_cnt,
        avg_resolution_hours=avg_res_hours,
        category_distribution=category_distribution,
        status_distribution=status_distribution,
        department_stats=department_stats
    )
