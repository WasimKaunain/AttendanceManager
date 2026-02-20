from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import shutil
import uuid

from app.db.session import SessionLocal
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord
from app.schemas.worker import WorkerCreate, WorkerResponse, WorkerUpdate
from app.core.dependencies import require_admin
from app.services.audit_service import log_action
from app.services.face_service import extract_face_embedding

router = APIRouter(prefix="/workers", tags=["Workers"])


# -----------------------------
# DB Dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# CREATE WORKER
# --------------------------------------------------
@router.post("/", response_model=WorkerResponse, dependencies=[Depends(require_admin)])
def create_worker(
    data: WorkerCreate,
    db: Session = Depends(get_db)
):
    payload = data.dict()

    # Generate Custom Worker ID
    last4_mobile = payload["mobile"][-4:]
    last4_id = payload["id_number"][-4:]
    worker_id = f"EMP{last4_mobile}{last4_id}"

    # Prevent ID conflict
    existing = db.query(Worker).filter(Worker.id == worker_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Worker ID conflict. Mobile + ID combination must be unique."
        )

    worker = Worker(
        id=worker_id,
        joining_date=date.today(),
        **payload
    )

    db.add(worker)
    db.commit()
    db.refresh(worker)

    log_action(
        db=db,
        action="create",
        entity_type="worker",
        entity_id=worker.id,
        details=f"Worker {worker.full_name} created"
    )

    return worker


# --------------------------------------------------
# DELETE WORKER
# --------------------------------------------------
@router.delete("/{worker_id}", dependencies=[Depends(require_admin)])
def delete_worker(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    db.delete(worker)
    db.commit()

    log_action(
        db=db,
        action="delete",
        entity_type="worker",
        entity_id=worker.id,
        details=f"Worker {worker.full_name} deleted"
    )

    return {"message": "Worker deleted successfully"}


# --------------------------------------------------
# LIST WORKERS
# --------------------------------------------------
@router.get("/", dependencies=[Depends(require_admin)])
def list_workers(
    project_id: str | None = None,
    site_id: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Worker)

    if project_id:
        query = query.filter(Worker.project_id == project_id)

    if site_id:
        query = query.filter(Worker.site_id == site_id)

    return query.all()


# --------------------------------------------------
# GET SINGLE WORKER
# --------------------------------------------------
@router.get("/{worker_id}", response_model=WorkerResponse, dependencies=[Depends(require_admin)])
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return worker


# --------------------------------------------------
# WORKER ATTENDANCE SUMMARY
# --------------------------------------------------
@router.get("/{worker_id}/attendance-summary", dependencies=[Depends(require_admin)])
def worker_attendance_summary(worker_id: str, db: Session = Depends(get_db)):

    present_days = db.query(AttendanceRecord)\
        .filter(
            AttendanceRecord.worker_id == worker_id,
            AttendanceRecord.check_in_time.isnot(None)
        ).count()

    total_hours = db.query(
        func.sum(AttendanceRecord.total_hours)
    ).filter(
        AttendanceRecord.worker_id == worker_id
    ).scalar() or 0

    absent_days = 0  # Can be implemented later

    return {
        "present_days": present_days,
        "absent_days": absent_days,
        "total_hours": total_hours
    }


# --------------------------------------------------
# PATCH / UPDATE WORKER
# --------------------------------------------------
@router.patch("/{worker_id}", response_model=WorkerResponse, dependencies=[Depends(require_admin)])
def patch_worker(
    worker_id: str,
    data: WorkerUpdate,
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    update_data = data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(worker, key, value)

    db.commit()
    db.refresh(worker)

    return worker
