from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.project import Project
from app.models.site import Site
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord
from app.core.dependencies import require_admin

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(require_admin)]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------
# Dashboard Stats
# ------------------------------
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    active_projects = db.query(Project).count()
    active_sites = db.query(Site).count()
    total_workers = db.query(Worker).count()

    today = date.today()

    # Present today
    present_today = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.date == today,
            AttendanceRecord.check_in_time.isnot(None)
        )
        .count()
    )

    # Late today
    late_count = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.date == today,
            AttendanceRecord.is_late == True
        )
        .count()
    )

    # Leave today (assuming status == "leave")
    leave_count = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.date == today,
            AttendanceRecord.status == "leave"
        )
        .count()
    )

    absent_count = total_workers - present_today - leave_count

    return {
        "activeProjects": active_projects,
        "activeSites": active_sites,
        "totalWorkers": total_workers,
        "presentToday": present_today,
        "todayStatus": {
            "present": present_today,
            "absent": max(absent_count, 0),
            "late": late_count,
            "leave": leave_count
        }
    }


# ------------------------------
# Weekly Attendance
# ------------------------------
@router.get("/weekly-attendance")
def weekly_attendance(db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=6)

    results = (
        db.query(
            AttendanceRecord.date,
            func.count(AttendanceRecord.id)
        )
        .filter(AttendanceRecord.date >= week_start)
        .group_by(AttendanceRecord.date)
        .all()
    )

    attendance_map = {r[0]: r[1] for r in results}

    response = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        response.append({
            "date": d.strftime("%a"),
            "count": attendance_map.get(d, 0)
        })

    return response


# ------------------------------
# Recent Attendance Activity
# ------------------------------
@router.get("/recent-activity")
def recent_activity(db: Session = Depends(get_db)):
    recent = (
        db.query(AttendanceRecord)
        .order_by(AttendanceRecord.check_in_time.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "workerId": str(r.worker_id),
            "siteId": str(r.site_id),
            "projectId": str(r.project_id),
            "date": str(r.date),
            "checkInTime": r.check_in_time.strftime("%H:%M") if r.check_in_time else None,
            "checkOutTime": r.check_out_time.strftime("%H:%M") if r.check_out_time else None,
            "status": r.status
        }
        for r in recent
    ]
