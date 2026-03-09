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
            "total_workers": site_workers,
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

    # Count present (checked-in) per day
    present_results = (
        db.query(
            AttendanceRecord.date,
            func.count(AttendanceRecord.id)
        )
        .filter(
            AttendanceRecord.date >= week_start,
            AttendanceRecord.check_in_time.isnot(None)
        )
        .group_by(AttendanceRecord.date)
        .all()
    )

    # Count absent per day (status = 'absent')
    absent_results = (
        db.query(
            AttendanceRecord.date,
            func.count(AttendanceRecord.id)
        )
        .filter(
            AttendanceRecord.date >= week_start,
            AttendanceRecord.status == "absent"
        )
        .group_by(AttendanceRecord.date)
        .all()
    )

    present_map = {r[0]: r[1] for r in present_results}
    absent_map = {r[0]: r[1] for r in absent_results}

    response = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        response.append({
            "day": d.strftime("%a"),
            "date": d.strftime("%d %b"),
            "present": present_map.get(d, 0),
            "absent": absent_map.get(d, 0),
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

    result = []
    for r in recent:
        worker = db.query(Worker).filter(Worker.id == r.worker_id).first()
        site = db.query(Site).filter(Site.id == r.check_in_site_id).first()
        checkout_site = db.query(Site).filter(Site.id == r.check_out_site_id).first() if r.check_out_site_id else None

        result.append({
            "worker_name": worker.full_name if worker else "Unknown Worker",
            "worker_id": str(r.worker_id),
            "site_name": site.name if site else "Unknown Site",
            "checkout_site_name": checkout_site.name if checkout_site else None,
            "date": str(r.date),
            "check_in_time": r.check_in_time.strftime("%I:%M %p") if r.check_in_time else None,
            "check_out_time": r.check_out_time.strftime("%I:%M %p") if r.check_out_time else None,
            "status": r.status,
            "is_late": r.is_late,
            "total_hours": round(r.total_hours, 1) if r.total_hours else None,
        })

    return result
