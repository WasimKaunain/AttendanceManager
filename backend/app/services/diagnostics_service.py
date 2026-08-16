from sqlalchemy import or_
import math
from app.models.debug_log import FaceLog, GeofenceLog


# ==========================================================
# Face Recognition Logs
# ==========================================================

def get_face_logs(
    db,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    worker_name: str | None = None,
    site_name: str | None = None,
    event_type: str | None = None,
    result: bool | None = None,
    start_date=None,
    end_date=None,
):
    query = db.query(FaceLog)

    if search:
        query = query.filter(
            or_(
                FaceLog.worker_name.ilike(f"%{search}%"),
                FaceLog.site_name.ilike(f"%{search}%"),
                FaceLog.notes.ilike(f"%{search}%"),
            )
        )

    if worker_name:
        query = query.filter(FaceLog.worker_name.ilike(f"%{worker_name}%"))

    if site_name:
        query = query.filter(FaceLog.site_name.ilike(f"%{site_name}%"))

    if event_type:
        query = query.filter(FaceLog.event_type == event_type)

    if result is not None:
        query = query.filter(FaceLog.result == result)

    if start_date:
        query = query.filter(FaceLog.created_at >= start_date)

    if end_date:
        query = query.filter(FaceLog.created_at <= end_date)

    total = query.count()

    offset = (page - 1) * page_size

    logs = (
        query.order_by(FaceLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "items": logs,
        "total": total,
        "page": page,
        "limit": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


# ==========================================================
# Geofence Logs
# ==========================================================

def get_geofence_logs(
    db,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    worker_name: str | None = None,
    site_name: str | None = None,
    event_type: str | None = None,
    result: bool | None = None,
    start_date=None,
    end_date=None,
):
    query = db.query(GeofenceLog)

    if search:
        query = query.filter(
            or_(
                GeofenceLog.worker_name.ilike(f"%{search}%"),
                GeofenceLog.site_name.ilike(f"%{search}%"),
                GeofenceLog.notes.ilike(f"%{search}%"),
            )
        )

    if worker_name:
        query = query.filter(GeofenceLog.worker_name.ilike(f"%{worker_name}%"))

    if site_name:
        query = query.filter(GeofenceLog.site_name.ilike(f"%{site_name}%"))

    if event_type:
        query = query.filter(GeofenceLog.event_type == event_type)

    if result is not None:
        query = query.filter(GeofenceLog.result == result)

    if start_date:
        query = query.filter(GeofenceLog.created_at >= start_date)

    if end_date:
        query = query.filter(GeofenceLog.created_at <= end_date)

    total = query.count()

    offset = (page - 1) * page_size

    logs = (
        query.order_by(GeofenceLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "items": logs,
        "total": total,
        "page": page,
        "limit": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }