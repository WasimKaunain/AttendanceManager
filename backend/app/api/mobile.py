from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.db.session import SessionLocal
from app.services.audit_service import log_action
from app.services.geofence import is_within_geofence
from app.services.face_service import is_same_person, cosine_similarity
from app.services.debug_logger import log_face, log_geofence
import uuid, shutil, os, json
from datetime import datetime, date, timedelta
from app.models.worker import Worker
from app.models.site import Site
from app.models.attendance import AttendanceRecord
from app.core.dependencies import require_site_incharge, get_site_id_or_raise
from app.schemas.mobile import (MobileWorkerResponse,LocationRequest,GeofenceResponse,FaceEnrollResponse,MobileAttendanceResponse,EmbeddingPayload)
from app.services.image_service import save_compressed_attendance_image, format_site_folder
from app.services.r2 import upload_file_to_r2
from uuid import UUID as _UUID

router = APIRouter(prefix="/mobile", tags=["Mobile"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _audit_si(user: dict) -> dict:
    """Extract audit fields from a site_incharge JWT payload."""
    return {
        "performed_by": _UUID(user["sub"]) if user.get("sub") else None,
        "performed_by_name": user.get("name") or user.get("sub", "Unknown"),
        "performed_by_role": "site_incharge",
    }

# --------------------------------------------------
# SITE DASHBOARD STATS
# --------------------------------------------------
@router.get("/dashboard/stats")
def get_site_dashboard_stats(
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    site_id = get_site_id_or_raise(user)

    today = date.today()

    total_workers = db.query(Worker).filter(
        Worker.site_id == site_id,
        Worker.is_deleted == False
    ).count()

    active_workers = db.query(Worker).filter(
        Worker.site_id == site_id,
        Worker.status == "active",
        Worker.is_deleted == False
    ).count()

    present_today = db.query(AttendanceRecord).filter(
        AttendanceRecord.check_in_site_id == site_id,
        AttendanceRecord.date == today,
        AttendanceRecord.check_in_time.isnot(None)
    ).count()

    absent_today = max(active_workers - present_today, 0)

    checked_out_today = db.query(AttendanceRecord).filter(
        AttendanceRecord.check_in_site_id == site_id,
        AttendanceRecord.date == today,
        AttendanceRecord.check_out_time.isnot(None)
    ).count()

    # Workers with no face enrolled yet
    unenrolled_count = db.query(Worker).filter(
        Worker.site_id == site_id,
        Worker.status == "active",
        Worker.is_deleted == False,
        Worker.face_embedding == None
    ).count()

    site = db.query(Site).filter(Site.id == site_id).first()
    site_name = site.name if site else "Unknown Site"

    return {
        "site_name": site_name,
        "total_workers": total_workers,
        "active_workers": active_workers,
        "present_today": present_today,
        "absent_today": absent_today,
        "checked_out_today": checked_out_today,
        "unenrolled_count": unenrolled_count,
    }


# --------------------------------------------------
# SITE WEEKLY ATTENDANCE CHART
# --------------------------------------------------
@router.get("/dashboard/weekly")
def get_site_weekly_attendance(
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    site_id = get_site_id_or_raise(user)

    today = date.today()
    week_start = today - timedelta(days=6)

    present_results = (
        db.query(AttendanceRecord.date, func.count(AttendanceRecord.id))
        .filter(
            AttendanceRecord.check_in_site_id == site_id,
            AttendanceRecord.date >= week_start,
            AttendanceRecord.check_in_time.isnot(None)
        )
        .group_by(AttendanceRecord.date)
        .all()
    )

    present_map = {r[0]: r[1] for r in present_results}

    # active workers count for absent calculation
    active_workers = db.query(Worker).filter(
        Worker.site_id == site_id,
        Worker.status == "active",
        Worker.is_deleted == False
    ).count()

    response = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        present = present_map.get(d, 0)
        response.append({
            "day": d.strftime("%a"),
            "date": d.strftime("%d %b"),
            "present": present,
            "absent": max(active_workers - present, 0),
        })

    return response


# --------------------------------------------------
# RECENT ACTIVITY (last 8 events for this site)
# --------------------------------------------------
@router.get("/dashboard/recent-activity")
def get_site_recent_activity(
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    site_id = get_site_id_or_raise(user)

    records = (
        db.query(AttendanceRecord, Worker)
        .join(Worker, Worker.id == AttendanceRecord.worker_id)
        .filter(AttendanceRecord.check_in_site_id == site_id)
        .order_by(AttendanceRecord.check_in_time.desc())
        .limit(8)
        .all()
    )

    result = []
    for r, worker in records:
        result.append({
            "worker_id":       r.worker_id,
            "worker_name":     worker.full_name if worker else "Unknown",
            "date":            str(r.date),
            "check_in_time":   r.check_in_time.strftime("%I:%M %p")  if r.check_in_time  else None,
            "check_out_time":  r.check_out_time.strftime("%I:%M %p") if r.check_out_time else None,
            "status":          r.status,
            "total_hours":     round(r.total_hours, 1) if r.total_hours else None,
        })
    return result


# --------------------------------------------------
# WORKERS LIST (all workers across all sites, with today's attendance status)
# --------------------------------------------------
@router.get("/site-workers")
def get_site_workers(
    search: str | None = Query(None),
    status: str | None = Query(None),   # "active" | "inactive"
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    today = date.today()

    # List ALL workers regardless of site — site incharge can work with any worker
    query = db.query(Worker).filter(
        Worker.is_deleted == False
    )

    if search:
        query = query.filter(
            or_(
                Worker.full_name.ilike(f"%{search}%"),
                Worker.mobile.ilike(f"%{search}%"),
                Worker.id.ilike(f"%{search}%")
            )
        )

    if status:
        query = query.filter(Worker.status == status)

    workers = query.order_by(Worker.full_name).all()

    # Batch-fetch today's attendance for all returned workers — avoids N+1 queries
    worker_ids = [w.id for w in workers]
    today_attendances = {}
    if worker_ids:
        att_rows = db.query(AttendanceRecord).filter(
            AttendanceRecord.worker_id.in_(worker_ids),
            AttendanceRecord.date == today
        ).all()
        today_attendances = {a.worker_id: a for a in att_rows}

    result = []
    for w in workers:
        attendance = today_attendances.get(w.id)

        if attendance and attendance.check_in_time:
            today_status = "checked_out" if attendance.check_out_time else "present"
        else:
            today_status = "absent"

        result.append({
            "id": w.id,
            "full_name": w.full_name,
            "mobile": w.mobile,
            "role": w.role,
            "type": w.type,
            "status": w.status,
            "joining_date": str(w.joining_date) if w.joining_date else None,
            "photo_url": w.photo_url,
            "today_status": today_status,
            "shift_id": str(w.shift_id) if w.shift_id else None,
            "daily_rate": w.daily_rate,
            "hourly_rate": w.hourly_rate,
            "monthly_salary": w.monthly_salary,
        })

    return result


# --------------------------------------------------
# SITE ATTENDANCE LIST (with filters)
# --------------------------------------------------
@router.get("/site-attendance")
def get_site_attendance(
    worker_name: str | None = Query(None),
    date_from: str | None = Query(None),   # YYYY-MM-DD
    date_to: str | None = Query(None),     # YYYY-MM-DD
    sort_order: str = Query("desc"),       # "asc" | "desc"
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    site_id = get_site_id_or_raise(user)

    # Join with Worker to allow SQL-level name filtering and avoid N+1 queries
    query = (
        db.query(AttendanceRecord, Worker)
        .join(Worker, Worker.id == AttendanceRecord.worker_id)
        .filter(AttendanceRecord.check_in_site_id == site_id)
    )

    if worker_name:
        query = query.filter(Worker.full_name.ilike(f"%{worker_name}%"))

    if date_from:
        try:
            query = query.filter(AttendanceRecord.date >= date.fromisoformat(date_from))
        except ValueError:
            pass

    if date_to:
        try:
            query = query.filter(AttendanceRecord.date <= date.fromisoformat(date_to))
        except ValueError:
            pass

    if sort_order == "asc":
        query = query.order_by(AttendanceRecord.date.asc(), AttendanceRecord.check_in_time.asc())
    else:
        query = query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.check_in_time.desc())

    rows = query.all()

    result = []
    for r, w in rows:
        result.append({
            "id": str(r.id),
            "worker_id": r.worker_id,
            "worker_name": w.full_name if w else "Unknown",
            "date": str(r.date),
            "check_in_time": r.check_in_time.strftime("%I:%M %p") if r.check_in_time else None,
            "check_out_time": r.check_out_time.strftime("%I:%M %p") if r.check_out_time else None,
            "status": r.status,
            "total_hours": round(r.total_hours, 1) if r.total_hours else None,
            "geofence_valid": r.geofence_valid,
        })

    return result



# --------------------------------------------------
# ENROLL FACE
# --------------------------------------------------

@router.post("/enroll-face/{worker_id}", response_model=FaceEnrollResponse)
def enroll_face(
    worker_id: str,
    embedding: str = Form(...),  # JSON string
    photo: UploadFile = File(...),
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    try:
        embedding_list = json.loads(embedding)
        payload = EmbeddingPayload(embedding=embedding_list)
    except:
        raise HTTPException(400, "Invalid embedding format")


    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Site incharge can enroll any worker regardless of which site they belong to
    site = db.query(Site).filter(Site.id == worker.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    site_folder = format_site_folder(site.name)

    # Save enrolled image
    file_bytes = photo.file.read()
    object_key = f"{site_folder}/{worker.id}/Assets/profile.jpg"

    upload_file_to_r2(file_bytes=file_bytes,object_key=object_key,content_type="image/jpeg")
    
    worker.face_embedding = payload.embedding
    worker.photo_url = object_key

    db.commit()

    log_action(
        db=db,
        action="face_enrolled",
        entity_type="worker",
        entity_id=worker.id,
        details=f"Worker {worker.full_name} face enrolled via mobile app",
        **_audit_si(user),
    )

    return {"message": "Face enrolled successfully"}


@router.get("/workers", response_model=list[MobileWorkerResponse])
def get_workers(
    search: str | None = Query(None),
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    # List ALL workers across all sites — site incharge can work with any worker
    query = db.query(Worker).filter(Worker.status == 'active')

    if search:
        query = query.filter(
            or_(
                Worker.full_name.ilike(f"%{search}%"),
                Worker.mobile.ilike(f"%{search}%"),
                Worker.id.ilike(f"%{search}%")
            )
        )

    return query.all()


@router.post("/verify-geofence", response_model=GeofenceResponse)
def verify_geofence(data: LocationRequest, user=Depends(require_site_incharge), db: Session = Depends(get_db)):
    site_id = user.get("site_id")

    if not site_id:
        return GeofenceResponse(inside=False, site_id=None, site_name=None)

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        return GeofenceResponse(inside=False, site_id=None, site_name=None)

    print(f"[GEOFENCE DEBUG] ── Site: {site.name}")
    print(f"[GEOFENCE DEBUG] ── Site lat={site.latitude}, lng={site.longitude}")
    print(f"[GEOFENCE DEBUG] ── Site radius={site.geofence_radius}m, boundary_type={site.boundary_type}")
    print(f"[GEOFENCE DEBUG] ── polygon_coords raw={site.polygon_coords}")
    print(f"[GEOFENCE DEBUG] ── Worker sent lat={data.latitude}, lng={data.longitude}")

    inside, distance_m, poly_pts = is_within_geofence(
        data.latitude, data.longitude,
        site.latitude, site.longitude,
        site.geofence_radius,
        boundary_type=getattr(site, "boundary_type", "circle"),
        polygon_coords=getattr(site, "polygon_coords", None),
    )

    log_geofence(
        event_type="verify_geofence",
        worker_id="N/A",
        worker_name="N/A",
        site_id=str(site.id),
        site_name=site.name,
        boundary_type=site.boundary_type,
        site_lat=site.latitude,
        site_lng=site.longitude,
        worker_lat=data.latitude,
        worker_lng=data.longitude,
        distance_m=distance_m,
        radius_m=site.geofence_radius,
        polygon_points=poly_pts,
        result=inside,
        notes="pre-checkin geofence test",
    )

    print(f"[GEOFENCE DEBUG] ── Result: inside={inside}")
    return GeofenceResponse(inside=inside, site_id=site.id, site_name=site.name)

# ===================== CHECK-IN =====================

@router.post("/check-in", response_model=MobileAttendanceResponse)
def check_in(
    worker_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    embedding: str = Form(...),  # JSON string
    photo: UploadFile = File(...),
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    today = date.today()

    site_id = get_site_id_or_raise(user)

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")
    print(f"Valid site and Site name : {site.name}")

    existing = db.query(AttendanceRecord).filter(AttendanceRecord.worker_id == worker_id,AttendanceRecord.date == today).first()

    if existing:
        raise HTTPException(400, "Already checked in today")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    # No site ownership check — site incharge can check in any worker regardless of their assigned site

    if not worker.face_embedding:
        raise HTTPException(400, "Worker face not enrolled")

    # 1️⃣ Save temporarily
    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    try:
        embedding_list = json.loads(embedding)
        payload = EmbeddingPayload(embedding=embedding_list)
    except:
        raise HTTPException(400, "Invalid embedding format")

    if not payload.embedding:
        os.remove(temp_path)
        raise HTTPException(400, "No face detected")

    if not is_same_person(payload.embedding, worker.face_embedding):
        similarity = cosine_similarity(payload.embedding, worker.face_embedding)
        log_face(
            event_type="check_in",
            worker_id=str(worker.id),
            worker_name=worker.full_name,
            site_id=str(site.id),
            site_name=site.name,
            similarity_score=similarity,
            threshold=float(os.getenv("THRESHOLD", 0.75)),
            result=False,
            embedding_length=len(payload.embedding),
            notes="face verification failed",
        )
        os.remove(temp_path)
        raise HTTPException(403, "Face verification failed")

    similarity = cosine_similarity(payload.embedding, worker.face_embedding)
    log_face(
        event_type="check_in",
        worker_id=str(worker.id),
        worker_name=worker.full_name,
        site_id=str(site.id),
        site_name=site.name,
        similarity_score=similarity,
        threshold=float(os.getenv("THRESHOLD", 0.75)),
        result=True,
        embedding_length=len(payload.embedding),
        notes="face verification passed",
    )
    print("Similarity:", similarity)

    # 3️⃣ Geofence validation
    inside, distance_m, poly_pts = is_within_geofence(
        latitude, longitude,
        site.latitude, site.longitude,
        site.geofence_radius,
        boundary_type=getattr(site, "boundary_type", "circle"),
        polygon_coords=getattr(site, "polygon_coords", None),
    )
    log_geofence(
        event_type="check_in",
        worker_id=str(worker.id),
        worker_name=worker.full_name,
        site_id=str(site.id),
        site_name=site.name,
        boundary_type=site.boundary_type,
        site_lat=site.latitude,
        site_lng=site.longitude,
        worker_lat=latitude,
        worker_lng=longitude,
        distance_m=distance_m,
        radius_m=site.geofence_radius,
        polygon_points=poly_pts,
        result=inside,
    )
    if not inside:
        os.remove(temp_path)
        raise HTTPException(403, "Outside geofence")

    # Image stored under the check-in site's folder (manager's current site)
    site_folder = format_site_folder(site.name)

    # 4️⃣ Save compressed to structured folder
    permanent_path = save_compressed_attendance_image(temp_path=temp_path,site_name=site_folder,worker_id=worker.id,mode="Checkin")

    # delete temp
    os.remove(temp_path)

    # 5️⃣ Create attendance record
    record = AttendanceRecord(
        worker_id=worker_id,
        check_in_site_id=site.id,
        project_id=site.project_id,
        date=today,
        check_in_time=datetime.utcnow(),
        check_in_lat=latitude,
        check_in_lng=longitude,
        check_in_selfie_url=permanent_path,
        status="checked_in",
        geofence_valid=True
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="check_in",
        entity_type="attendance",
        entity_id=str(record.id),
        details=f"Worker {worker_id} ({worker.full_name}) checked in at site {site.name}",
        **_audit_si(user),
    )

    return record


# ===================== CHECK-OUT =====================

@router.post("/check-out", response_model=MobileAttendanceResponse)
def check_out(
    worker_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    embedding: str = Form(...),
    photo: UploadFile = File(...),
    user=Depends(require_site_incharge),
    db: Session = Depends(get_db)
):
    print("---- CHECKOUT DEBUG START ----")
    print("Worker ID:", worker_id)
    print("Latitude:", latitude, "Longitude:", longitude)

    today = date.today()
    print("Today:", today)

    site_id = get_site_id_or_raise(user)
    print("Manager site_id:", site_id)


    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        print("FAIL: Invalid site")
        raise HTTPException(400, "Invalid site")

    print("Site Name:", site.name)

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker_id,
        AttendanceRecord.date == today
    ).first()

    print("Attendance record found:", bool(record))

    if not record or not record.check_in_time:
        print("FAIL: No check-in found")
        raise HTTPException(400, "No check-in found")

    if record.check_out_time:
        print("FAIL: Already checked out")
        raise HTTPException(400, "Already checked out")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        print("FAIL: Worker not found")
        raise HTTPException(400, "Worker not found")

    # No site ownership check — a worker can check out at a different site than where they checked in

    if not worker.face_embedding:
        print("FAIL: Face not enrolled")
        raise HTTPException(400, "Worker face not enrolled")

    print("Worker face embedding exists")

    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    try:
        embedding_list = json.loads(embedding)
        payload = EmbeddingPayload(embedding=embedding_list)
    except Exception as e:
        print("FAIL: Invalid embedding format", e)
        raise HTTPException(400, "Invalid embedding format")

    if not payload.embedding:
        os.remove(temp_path)
        print("FAIL: No face detected in payload")
        raise HTTPException(400, "No face detected")

    similarity = cosine_similarity(payload.embedding, worker.face_embedding)
    print("Similarity score:", similarity)

    if not is_same_person(payload.embedding, worker.face_embedding):
        log_face(
            event_type="check_out",
            worker_id=str(worker.id),
            worker_name=worker.full_name,
            site_id=str(site.id),
            site_name=site.name,
            similarity_score=similarity,
            threshold=float(os.getenv("THRESHOLD", 0.75)),
            result=False,
            embedding_length=len(payload.embedding),
            notes="face verification failed",
        )
        os.remove(temp_path)
        print("FAIL: Face verification failed")
        raise HTTPException(403, "Face verification failed")

    log_face(
        event_type="check_out",
        worker_id=str(worker.id),
        worker_name=worker.full_name,
        site_id=str(site.id),
        site_name=site.name,
        similarity_score=similarity,
        threshold=float(os.getenv("THRESHOLD", 0.75)),
        result=True,
        embedding_length=len(payload.embedding),
        notes="face verification passed",
    )

    inside, distance_m, poly_pts = is_within_geofence(
        latitude,
        longitude,
        site.latitude,
        site.longitude,
        site.geofence_radius,
        boundary_type=getattr(site, "boundary_type", "circle"),
        polygon_coords=getattr(site, "polygon_coords", None),
    )
    log_geofence(
        event_type="check_out",
        worker_id=str(worker.id),
        worker_name=worker.full_name,
        site_id=str(site.id),
        site_name=site.name,
        boundary_type=site.boundary_type,
        site_lat=site.latitude,
        site_lng=site.longitude,
        worker_lat=latitude,
        worker_lng=longitude,
        distance_m=distance_m,
        radius_m=site.geofence_radius,
        polygon_points=poly_pts,
        result=inside,
    )
    print("Geofence result:", inside)

    if not inside:
        os.remove(temp_path)
        print("FAIL: Outside geofence")
        raise HTTPException(403, "Outside geofence")

    print("PASS: Face + Geofence valid")

    # Image stored under the check-out site's folder (manager's current site)
    site_folder = format_site_folder(site.name)

    permanent_path = save_compressed_attendance_image(temp_path=temp_path,site_name=site_folder,worker_id=worker.id,mode="Checkout")

    os.remove(temp_path)

    record.check_out_site_id = site.id   # manager's current site — may differ from check-in site
    record.check_out_time = datetime.utcnow()
    record.check_out_lat = latitude
    record.check_out_lng = longitude
    record.check_out_selfie_url = permanent_path
    record.status = "checked_out"
    record.geofence_valid = True

    # Calculate total hours and overtime
    try:
        if record.check_in_time and record.check_out_time:
            delta = record.check_out_time - record.check_in_time
            total_hours = round(delta.total_seconds() / 3600, 2)
        else:
            total_hours = 0
    except Exception:
        total_hours = 0

    record.total_hours = total_hours

    # compute overtime based on worker.daily_working_hours (nullable)
    dw_hours = getattr(worker, 'daily_working_hours', None) or 0
    overtime = max(0, total_hours - dw_hours)
    record.overtime_hours = round(overtime, 2)

    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="check_out",
        entity_type="attendance",
        entity_id=str(record.id),
        details=f"Worker {worker_id} ({worker.full_name}) checked out at site {site.name}. Hours: {round(record.total_hours or 0, 2)}",
        **_audit_si(user),
    )

    print("Checkout successful")
    print("---- CHECKOUT DEBUG END ----")

    return record