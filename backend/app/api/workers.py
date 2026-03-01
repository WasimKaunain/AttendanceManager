from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from app.db.session import SessionLocal
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord
from app.schemas.worker import WorkerCreate, WorkerResponse, WorkerUpdate, ActionResponse, ForceDeleteRequest, ArchiveRequest
from app.core.dependencies import require_admin
from app.services.audit_service import log_action
from app.services.r2 import generate_presigned_download_url

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


@router.get("/", response_model=list[WorkerResponse], dependencies=[Depends(require_admin)])
def list_workers(
    include_deleted: bool = False,
    project_id: str | None = None,
    site_id: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Worker)

    if not include_deleted:
        query = query.filter(Worker.is_deleted == False)

    if project_id:
        query = query.filter(Worker.project_id == project_id)

    if site_id:
        query = query.filter(Worker.site_id == site_id)

    workers = query.all()

    for w in workers:
        if w.photo_url:
            w.photo_signed_url = generate_presigned_download_url(w.photo_url)
        else:
            w.photo_signed_url = None

    return workers


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


@router.patch("/{worker_id}/archive",response_model=ActionResponse,dependencies=[Depends(require_admin)])
def archive_worker(worker_id: str,payload: ArchiveRequest,db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(404, "Worker not found")

    if worker.is_deleted:
        raise HTTPException(400, "Worker already archived")

    worker.is_deleted = True
    worker.deleted_at = datetime.utcnow()
    worker.status = "inactive"

    db.commit()

    log_action(
        db=db,
        action="archive",
        entity_type="worker",
        entity_id=worker.id,
        details=payload.reason
    )

    return {"message": "Worker archived successfully"}



@router.patch("/{worker_id}/restore",response_model=ActionResponse,dependencies=[Depends(require_admin)])
def restore_worker(worker_id: str, db: Session = Depends(get_db)):

    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(404, "Worker not found")

    if not worker.is_deleted:
        raise HTTPException(400, "Worker is not archived")

    worker.is_deleted = False
    worker.deleted_at = None
    worker.deleted_by = None
    worker.status = "active"

    db.commit()

    log_action(
        db=db,
        action="restore",
        entity_type="worker",
        entity_id=worker.id,
        details=f"Worker {worker.full_name} restored"
    )

    return {"message": "Worker restored successfully"}



@router.delete("/{worker_id}/force-delete",response_model=ActionResponse,dependencies=[Depends(require_admin)])
def force_delete_worker(worker_id: str,payload: ForceDeleteRequest,db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(404, "Worker not found")

    if payload.confirmation != worker.full_name:
        raise HTTPException(400, "Confirmation text mismatch")

    # Delete attendance linked to worker
    db.query(AttendanceRecord).filter(AttendanceRecord.worker_id == worker_id).delete()

    # Delete worker
    db.delete(worker)
    db.commit()

    log_action(
        db=db,
        action="force_delete",
        entity_type="worker",
        entity_id=worker.id,
        details=payload.reason
    )

    return {"message": "Worker permanently deleted"}

@router.get("/{worker_id}/photo")
def get_worker_photo(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker or not worker.photo_url:
        raise HTTPException(404, "Photo not found")

    url = generate_presigned_download_url(worker.photo_url)

    return {"url": url}