from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Body
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
from collections import defaultdict

from app.db.session import SessionLocal
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord
from app.models.site import Site
from app.models.payroll import PayrollEntry
from app.schemas.worker import WorkerCreate, WorkerResponse, WorkerUpdate, ActionResponse, ForceDeleteRequest, ArchiveRequest
from app.core.dependencies import require_admin
from app.services.audit_service import log_action
from app.services.r2 import generate_presigned_download_url, upload_file_to_r2, s3, R2_BUCKET
from app.services.image_service import format_site_folder

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
def create_worker(data: WorkerCreate,db: Session = Depends(get_db)):

    payload = data.dict()

    # Generate Custom Worker ID
    last4_mobile = payload["mobile"][-4:]
    last4_id = payload["id_number"][-4:]
    worker_id = f"EMP{last4_mobile}{last4_id}"

    # Prevent Worker ID conflict
    existing = db.query(Worker).filter(Worker.id == worker_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Worker ID conflict. Mobile + ID combination must be unique."
        )

    # Check duplicate mobile
    mobile_exists = db.query(Worker).filter(Worker.mobile == payload["mobile"]).first()
    if mobile_exists:
        raise HTTPException(
            status_code=400,
            detail="This mobile number is already registered."
        )

    # Check duplicate ID number
    id_exists = db.query(Worker).filter(Worker.id_number == payload["id_number"]).first()
    if id_exists:
        raise HTTPException(
            status_code=400,
            detail="This ID number is already registered."
        )

    try:

        worker = Worker(
            id=worker_id,
            joining_date=date.today(),
            **payload
        )

        db.add(worker)
        db.commit()
        db.refresh(worker)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Database error while creating worker."
        )

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
# WORKER ATTENDANCE INSIGHT  (for profile tab)
# --------------------------------------------------
@router.get("/{worker_id}/attendance-insight", dependencies=[Depends(require_admin)])
def worker_attendance_insight(
    worker_id: str,
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Returns attendance analytics for the worker profile Attendance tab.
    Optional ?year=&month= to drive the calendar heatmap (defaults to current month).
    """
    today = date.today()
    cal_year  = year  or today.year
    cal_month = month or today.month

    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.worker_id == worker_id)
        .order_by(AttendanceRecord.date.desc())
        .all()
    )

    # ── Stat Pills ────────────────────────────────────────────────────────────
    checked_in = [r for r in records if r.check_in_time]
    total_present = len(checked_in)
    total_hours   = sum(r.total_hours or 0 for r in records)
    avg_daily_hrs = round(total_hours / total_present, 1) if total_present else 0

    # Avg check-in / check-out times (minutes since midnight)
    def avg_time(times):
        valid = [t.hour * 60 + t.minute for t in times if t]
        if not valid:
            return None
        avg_min = int(sum(valid) / len(valid))
        return f"{avg_min // 60:02d}:{avg_min % 60:02d}"

    avg_checkin  = avg_time([r.check_in_time  for r in checked_in])
    avg_checkout = avg_time([r.check_out_time for r in checked_in if r.check_out_time])

    # Streaks
    present_dates = {r.date for r in records if r.check_in_time}
    streak = 0
    check = today
    while check in present_dates:
        streak += 1
        check -= timedelta(days=1)

    sorted_dates = sorted(present_dates)
    longest = cur = 0
    prev = None
    for d in sorted_dates:
        if prev and (d - prev).days == 1:
            cur += 1
        else:
            cur = 1
        longest = max(longest, cur)
        prev = d

    # ── Monthly Trend (last 6 months) ─────────────────────────────────────────
    monthly: dict[str, float] = {}
    for i in range(5, -1, -1):
        y = today.year
        m = today.month - i
        while m <= 0:
            m += 12
            y -= 1
        monthly[date(y, m, 1).strftime("%b %Y")] = 0.0

    for r in records:
        if not r.check_in_time:
            continue
        label = r.date.strftime("%b %Y")
        if label in monthly:
            monthly[label] += r.total_hours or 0

    monthly_trend = [{"month": k, "hours": round(v, 1)} for k, v in monthly.items()]

    # ── Heatmap — requested month (full month, future days = "future") ─────────
    first_day = date(cal_year, cal_month, 1)
    if cal_month == 12:
        last_day = date(cal_year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(cal_year, cal_month + 1, 1) - timedelta(days=1)

    month_map: dict[date, str] = {}
    for r in records:
        if first_day <= r.date <= last_day and r.check_in_time:
            month_map[r.date] = "late" if r.is_late else "present"

    heatmap = []
    d = first_day
    while d <= last_day:
        if d > today:
            status = "future"
        else:
            status = month_map.get(d, "absent")
        heatmap.append({
            "date":    d.isoformat(),
            "day":     d.day,
            "weekday": d.strftime("%a"),
            "status":  status,
        })
        d += timedelta(days=1)

    return {
        "stat_pills": {
            "total_present":  total_present,
            "total_hours":    round(total_hours, 1),
            "avg_daily_hrs":  avg_daily_hrs,
            "avg_checkin":    avg_checkin,
            "avg_checkout":   avg_checkout,
            "current_streak": streak,
            "longest_streak": longest,
        },
        "monthly_trend": monthly_trend,
        "heatmap": heatmap,
        "heatmap_label": first_day.strftime("%B %Y"),
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


# --------------------------------------------------
# WORKER ASSETS  (R2 folder: {site_folder}/{worker_id}/Assets/)
# --------------------------------------------------

def _worker_asset_prefix(worker: Worker, db: Session) -> str:
    """Return the R2 prefix for this worker's Assets folder."""
    site = db.query(Site).filter(Site.id == worker.site_id).first()
    if not site:
        raise HTTPException(404, "Worker has no site assigned")
    site_folder = format_site_folder(site.name)
    return f"{site_folder}/{worker.id}/Assets/"


@router.get("/{worker_id}/assets", dependencies=[Depends(require_admin)])
def list_worker_assets(worker_id: str, db: Session = Depends(get_db)):
    """List all files in the worker's Assets folder on R2."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    prefix = _worker_asset_prefix(worker, db)

    response = s3.list_objects_v2(Bucket=R2_BUCKET, Prefix=prefix)

    files = []
    for obj in response.get("Contents", []):
        key = obj["Key"]
        if key == prefix or key.endswith("/"):
            continue
        files.append({
            "key": key,
            "name": key.split("/")[-1],
            "size": obj["Size"],
            "last_modified": obj["LastModified"].isoformat(),
            "download_url": generate_presigned_download_url(key),
        })

    return {"prefix": prefix, "files": files}


@router.post("/{worker_id}/assets", dependencies=[Depends(require_admin)])
async def upload_worker_asset(
    worker_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a file into the worker's Assets folder on R2."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    prefix = _worker_asset_prefix(worker, db)
    object_key = f"{prefix}{file.filename}"

    file_bytes = await file.read()
    upload_file_to_r2(
        file_bytes=file_bytes,
        object_key=object_key,
        content_type=file.content_type or "application/octet-stream",
    )

    return {
        "message": "File uploaded successfully",
        "key": object_key,
        "name": file.filename,
    }


@router.delete("/{worker_id}/assets", dependencies=[Depends(require_admin)])
def delete_worker_asset(worker_id: str, key: str, db: Session = Depends(get_db)):
    """Delete a specific file from the worker's Assets folder on R2."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    # Safety: ensure the key actually belongs to this worker
    prefix = _worker_asset_prefix(worker, db)
    if not key.startswith(prefix.rstrip("/")):
        raise HTTPException(403, "Key does not belong to this worker's assets")

    try:
        s3.delete_object(Bucket=R2_BUCKET, Key=key)
    except Exception:
        raise HTTPException(500, "Delete failed")

    return {"message": "File deleted successfully"}


# ──────────────────────────────────────────────────────────────────
#  PAYROLL ENDPOINTS
# ──────────────────────────────────────────────────────────────────

@router.get("/{worker_id}/payroll", dependencies=[Depends(require_admin)])
def get_payroll(
    worker_id: str,
    year:  int = Query(default=None),
    month: int = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Returns payroll summary for a given month:    - gross earnings (from attendance × rate)
    - advance/deduction/bonus entries
    - net payable
    - payment history (last 6 months)
    """
    from calendar import month_name as _month_name

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    today = date.today()
    y = year  or today.year
    m = month or today.month
    month_label = f"{_month_name[m]} {y}"

    # ── Attendance for the month ─────────────────────────────────
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker_id,
        extract("year",  AttendanceRecord.date) == y,
        extract("month", AttendanceRecord.date) == m,
        AttendanceRecord.status == "present",
    ).all()

    present_days  = len(records)
    total_hours   = round(sum(r.total_hours or 0 for r in records), 2)

    # ── Gross calculation ─────────────────────────────────────────
    if worker.type == "contract":
        rate       = worker.hourly_rate or 0
        rate_label = f"₹{rate}/hr"
        gross      = round(total_hours * rate, 2)
    else:  # permanent
        rate       = worker.daily_rate or 0
        rate_label = f"₹{rate}/day"
        gross      = round(present_days * rate, 2)

    # ── Entries for this month ────────────────────────────────────
    entries = db.query(PayrollEntry).filter(
        PayrollEntry.worker_id == worker_id,
        PayrollEntry.year  == y,
        PayrollEntry.month == m,
    ).order_by(PayrollEntry.date).all()

    total_advances   = round(sum(e.amount for e in entries if e.entry_type == "advance"),   2)
    total_deductions = round(sum(e.amount for e in entries if e.entry_type == "deduction"), 2)
    total_bonuses    = round(sum(e.amount for e in entries if e.entry_type == "bonus"),     2)
    net_payable      = round(gross + total_bonuses - total_advances - total_deductions, 2)

    # ── Last 6 months history ─────────────────────────────────────
    history = []
    for delta in range(5, -1, -1):
        hm = m - delta
        hy = y
        while hm < 1:
            hm += 12
            hy -= 1
        label = f"{_month_name[hm][:3]} {hy}"

        h_records = db.query(AttendanceRecord).filter(
            AttendanceRecord.worker_id == worker_id,
            extract("year",  AttendanceRecord.date) == hy,
            extract("month", AttendanceRecord.date) == hm,
            AttendanceRecord.status == "present",
        ).all()
        h_hours = round(sum(r.total_hours or 0 for r in h_records), 2)
        h_days  = len(h_records)
        h_gross = round(h_hours * (worker.hourly_rate or 0), 2) if worker.type == "contract" \
                  else round(h_days * (worker.daily_rate or 0), 2)

        h_entries = db.query(PayrollEntry).filter(
            PayrollEntry.worker_id == worker_id,
            PayrollEntry.year == hy,
            PayrollEntry.month == hm,
        ).all()
        h_deduct = round(sum(e.amount for e in h_entries if e.entry_type in ("advance", "deduction")), 2)
        h_bonus  = round(sum(e.amount for e in h_entries if e.entry_type == "bonus"), 2)
        h_net    = round(h_gross + h_bonus - h_deduct, 2)

        history.append({"month": label, "gross": h_gross, "net": h_net})

    return {
        "month_label":       month_label,
        "worker_type":       worker.type,
        "rate_label":        rate_label,
        "present_days":      present_days,
        "total_hours":       total_hours,
        "gross":             gross,
        "total_advances":    total_advances,
        "total_deductions":  total_deductions,
        "total_bonuses":     total_bonuses,
        "net_payable":       net_payable,
        "entries": [
            {
                "id":         str(e.id),
                "entry_type": e.entry_type,
                "amount":     e.amount,
                "date":       str(e.date),
                "note":       e.note or "",
                "created_by": e.created_by or "admin",
            }
            for e in entries
        ],
        "history": history,
    }


@router.post("/{worker_id}/payroll/entries", dependencies=[Depends(require_admin)])
def add_payroll_entry(
    worker_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """
    Add an advance / deduction / bonus entry for a worker.
    Body: { entry_type, amount, date, note, year, month }
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    entry_type = payload.get("entry_type", "advance")
    if entry_type not in ("advance", "deduction", "bonus"):
        raise HTTPException(400, "entry_type must be advance | deduction | bonus")

    try:
        entry_date = date.fromisoformat(payload["date"])
    except (KeyError, ValueError):
        raise HTTPException(400, "Invalid or missing date (YYYY-MM-DD)")

    amount = float(payload.get("amount", 0))
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    entry = PayrollEntry(
        worker_id  = worker_id,
        year       = payload.get("year",  entry_date.year),
        month      = payload.get("month", entry_date.month),
        entry_type = entry_type,
        amount     = amount,
        date       = entry_date,
        note       = payload.get("note", ""),
        created_by = current_user.username if hasattr(current_user, "username") else "admin",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id":         str(entry.id),
        "entry_type": entry.entry_type,
        "amount":     entry.amount,
        "date":       str(entry.date),
        "note":       entry.note,
        "created_by": entry.created_by,
    }


@router.delete("/{worker_id}/payroll/entries/{entry_id}", dependencies=[Depends(require_admin)])
def delete_payroll_entry(
    worker_id: str,
    entry_id:  str,
    db: Session = Depends(get_db),
):
    """Delete a specific payroll entry by ID."""
    import uuid as _uuid
    entry = db.query(PayrollEntry).filter(        PayrollEntry.id        == _uuid.UUID(entry_id),
        PayrollEntry.worker_id == worker_id,
    ).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}
