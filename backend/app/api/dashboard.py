from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta, timezone, datetime
from sqlalchemy import func
import pytz
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.site import Site
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord
from app.core.dependencies import require_admin
from app.services.attendance_response_admin import serialize_admin_attendance

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

    utc_now = datetime.now(timezone.utc)

    # ⚠️ Global present (approximation)
    # NOTE: This is tricky in multi-timezone systems
    present_today = db.query(AttendanceRecord).filter(AttendanceRecord.check_in_time.isnot(None)).count()

    site_status_list = []

    active_sites_list = db.query(Site).filter(Site.status == "active").all()

    for site in active_sites_list:

        tz = pytz.timezone(site.timezone)
        local_today = utc_now.astimezone(tz).date()

        site_workers = db.query(Worker).filter(Worker.site_id == site.id, Worker.status == "active").count()

        present = db.query(AttendanceRecord).filter(AttendanceRecord.check_in_site_id == site.id,AttendanceRecord.date == local_today,AttendanceRecord.check_in_time.isnot(None)).count()

        leave = db.query(AttendanceRecord).filter(AttendanceRecord.check_in_site_id == site.id,AttendanceRecord.date == local_today,AttendanceRecord.status == "leave").count()

        absent = max(site_workers - present - leave, 0)

        site_status_list.append({
            "site_id": str(site.id),
            "site_name": site.name,
            "total_workers": site_workers,
            "present": present,
            "absent": absent,
            "late": None,
            "leave": leave
        })

    return {
        "activeProjects": active_projects,
        "activeSites": active_sites,
        "totalWorkers": total_workers,
        "presentToday": sum(s["present"] for s in site_status_list),  # ✅ correct global
        "todayStatus": site_status_list
    }


# ------------------------------
# Weekly Attendance
# ------------------------------
from datetime import datetime, timedelta, timezone

@router.get("/weekly-attendance")
def weekly_attendance(db: Session = Depends(get_db)):

    utc_now = datetime.now(timezone.utc)
    week_start = utc_now - timedelta(days=6)

    # PRESENT (based on check-in time)
    present_results = (db.query(func.date(AttendanceRecord.check_in_time),func.count(AttendanceRecord.id)).filter(AttendanceRecord.check_in_time >= week_start,AttendanceRecord.check_in_time.isnot(None)).group_by(func.date(AttendanceRecord.check_in_time)).all())

    # ABSENT (based on date — still tricky but acceptable)
    absent_results = (db.query(AttendanceRecord.date,func.count(AttendanceRecord.id)).filter(AttendanceRecord.date >= week_start.date(),AttendanceRecord.status == "absent").group_by(AttendanceRecord.date).all())

    present_map = {r[0]: r[1] for r in present_results}
    absent_map = {r[0]: r[1] for r in absent_results}

    response = []
    for i in range(7):
        d = (utc_now - timedelta(days=6 - i)).date()

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

    recent = (db.query(AttendanceRecord).order_by(AttendanceRecord.check_in_time.desc()).limit(5).all())

    # 🔥 Batch fetch related data (avoid N+1)
    worker_ids = [r.worker_id for r in recent]
    site_ids = list(set([r.check_in_site_id for r in recent if r.check_in_site_id] +[r.check_out_site_id for r in recent if r.check_out_site_id]))

    workers = db.query(Worker).filter(Worker.id.in_(worker_ids)).all()
    sites = db.query(Site).filter(Site.id.in_(site_ids)).all()

    worker_map = {w.id: w for w in workers}
    site_map = {s.id: s for s in sites}

    result = []
    for r in recent:
        worker = worker_map.get(r.worker_id)
        site = site_map.get(r.check_in_site_id)
        checkout_site = site_map.get(r.check_out_site_id) if r.check_out_site_id else None

        timezone_str = site.timezone if site else "UTC"

        obj = serialize_admin_attendance(r, timezone_str)

        result.append({
            "worker_name": worker.full_name if worker else "Unknown Worker",
            "worker_id": str(r.worker_id),
            "site_name": site.name if site else "Unknown Site",
            "checkout_site_name": checkout_site.name if checkout_site else None,
            "date": str(obj.date),
            "check_in_time": obj.check_in_time,
            "check_out_time": obj.check_out_time,
            "status": obj.status,
            "total_hours": round(obj.total_hours, 1) if obj.total_hours else None,
        })

    return result
