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
    active_projects = db.query(Project).filter(Project.status == 'active').count()
    active_sites = db.query(Site).filter(Site.status == 'active').count()
    total_workers = db.query(Worker).filter(Worker.status == 'active').count()

    today = date.today()

    # GLOBAL PRESENT (for top number)
    present_today = (db.query(AttendanceRecord).filter(AttendanceRecord.date == today,AttendanceRecord.check_in_time.isnot(None)).count())

    # ---------------------------
    # SITE-WISE STATUS
    # ---------------------------
    site_status_list = []

    active_sites_list = db.query(Site).filter(Site.status == "active").all()

    for site in active_sites_list:

        # Total active workers in that site
        site_workers = db.query(Worker).filter(
            Worker.site_id == site.id,
            Worker.status == "active"
        ).count()

        # Present
        present = db.query(AttendanceRecord).filter(
            AttendanceRecord.date == today,
            AttendanceRecord.check_in_site_id == site.id,
            AttendanceRecord.check_in_time.isnot(None)
        ).count()

        # Late
        late = db.query(AttendanceRecord).filter(
            AttendanceRecord.date == today,
            AttendanceRecord.check_in_site_id == site.id,
            AttendanceRecord.is_late == True
        ).count()

        # Leave
        leave = db.query(AttendanceRecord).filter(
            AttendanceRecord.date == today,
            AttendanceRecord.check_in_site_id == site.id,
            AttendanceRecord.status == "leave"
        ).count()

        absent = max(site_workers - present - leave, 0)

        site_status_list.append({
            "site_id": str(site.id),
            "site_name": site.name,
            "present": present,
            "absent": absent,
            "late": late,
            "leave": leave
        })

    return {
        "activeProjects": active_projects,
        "activeSites": active_sites,
        "totalWorkers": total_workers,
        "presentToday": present_today,
        "todayStatus": site_status_list
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
           # "siteId": str(r.site_id),
            "projectId": str(r.project_id),
            "date": str(r.date),
            "checkInTime": r.check_in_time.strftime("%H:%M") if r.check_in_time else None,
            "checkOutTime": r.check_out_time.strftime("%H:%M") if r.check_out_time else None,
            "status": r.status
        }
        for r in recent
    ]
