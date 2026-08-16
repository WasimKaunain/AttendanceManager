from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.session import SessionLocal
from app.schemas.diagnostics import (FaceLogListResponse, GeofenceLogListResponse)
from app.services import diagnostics_service


router = APIRouter(
    prefix="/diagnostics",
    tags=["Diagnostics"],
    dependencies=[Depends(require_admin)]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# Face Recognition Logs
# =========================================================

@router.get("/face-logs", response_model=FaceLogListResponse)
def list_face_logs(
    search: str | None = None,
    worker_name: str | None = None,
    site_name: str | None = None,
    event_type: str | None = None,
    result: bool | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return diagnostics_service.get_face_logs(
        db=db,
        search=search,
        worker_name=worker_name,
        site_name=site_name,
        event_type=event_type,
        result=result,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=limit,
    )


# =========================================================
# Geofence Logs
# =========================================================

@router.get("/geofence-logs", response_model=GeofenceLogListResponse)
def list_geofence_logs(
    search: str | None = None,
    worker_name: str | None = None,
    site_name: str | None = None,
    event_type: str | None = None,
    result: bool | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return diagnostics_service.get_geofence_logs(
        db=db,
        search=search,
        worker_name=worker_name,
        site_name=site_name,
        event_type=event_type,
        result=result,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=limit,
    )


# =========================================================
# System Health
# =========================================================

@router.get("/system-health")
def get_system_health():
    """
    Placeholder endpoint.
    Live server, database and application health metrics
    will be implemented in the next phase.
    """
    return {
        "status": "ok",
        "message": "System Health API coming soon."
    }