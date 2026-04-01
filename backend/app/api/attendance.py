from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.attendance import AttendanceRecord
from app.schemas.attendance import AttendanceResponse
from app.core.dependencies import require_admin
from app.services.attendance_response_admin import serialize_admin_attendance
from app.models.site import Site

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AttendanceResponse], dependencies=[Depends(require_admin)])
def list_attendance(db: Session = Depends(get_db)):

    records = db.query(AttendanceRecord).order_by(
        AttendanceRecord.date.desc(),
        AttendanceRecord.check_in_time.desc()
    ).all()

    # fetch site timezones
    site_ids = set(
        [r.check_in_site_id for r in records if r.check_in_site_id] +
        [r.check_out_site_id for r in records if r.check_out_site_id]
    )

    sites = db.query(Site).filter(Site.id.in_(site_ids)).all()
    site_map = {s.id: s for s in sites}

    result = []
    for r in records:
        site = site_map.get(r.check_in_site_id) or site_map.get(r.check_out_site_id)
        timezone_str = site.timezone if site else "UTC"

        obj = serialize_admin_attendance(r, timezone_str)
        result.append(obj)

    return result
