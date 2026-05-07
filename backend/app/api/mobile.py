from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.db.session import SessionLocal
from app.services.attendance_response_service import serialize_attendance
from app.services.audit_service import log_action
from app.services.geofence import is_within_geofence
from app.services.face_service import is_same_person, cosine_similarity
from app.services.debug_logger import log_face, log_geofence
import uuid, shutil, os, json, pytz, math
from datetime import datetime, date, timedelta, timezone
from app.models.worker import Worker
from app.models.site import Site
from app.models.attendance import AttendanceRecord
from app.core.dependencies import require_mobile_user, require_admin, get_site_id_or_raise
from app.core.security import create_access_token
from app.schemas.mobile import (
    MobileWorkerResponse,
    LocationRequest,
    GeofenceResponse,
    FaceEnrollResponse,
    MobileAttendanceResponse,
    EmbeddingPayload,
    MobileSiteOption,
    AdminSelectSiteRequest,
    AdminSelectSiteResponse,
    MobileWorkerPhotoResponse,
)
from app.services.image_service import save_compressed_attendance_image, format_site_folder
from app.services.r2 import upload_file_to_r2, generate_presigned_download_url
from app.services.worker_photo_service import resolve_worker_profile_photo_key
from app.services.image_service_failed import save_compressed_failed_face_image
from uuid import UUID as _UUID

router = APIRouter(prefix="/mobile", tags=["Mobile"])


def serialize_worker_mobile(w, role: str):
    data = {
        "id": w.id,
        "full_name": w.full_name,
        "mobile": w.mobile,
        "role": w.role,
        "type": w.type,
        "status": w.status,
        "joining_date": str(w.joining_date) if w.joining_date else None,
        "photo_url": w.photo_url,
        "shift_id": str(w.shift_id) if w.shift_id else None,
    }

    # 🔐 Role-based salary visibility
    if role == "admin":
        data.update({
            "daily_rate": w.daily_rate,
            "hourly_rate": w.hourly_rate,
            "monthly_salary": w.monthly_salary,
        })

    return data

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _audit_mobile(user: dict) -> dict:
    """Extract audit fields from a mobile JWT payload (admin or site_incharge)."""
    return {
        "performed_by": _UUID(user["sub"]) if user.get("sub") else None,
        "performed_by_name": user.get("name") or user.get("sub", "Unknown"),
        "performed_by_role": user.get("role") or "unknown",
    }


# --------------------------------------------------
# ADMIN SITE SELECTION
# --------------------------------------------------
@router.get("/admin/sites", response_model=list[MobileSiteOption])
def get_admin_mobile_sites(user=Depends(require_admin),db: Session = Depends(get_db)):
    sites = (db.query(Site).filter(Site.status == "active", Site.is_deleted == False).order_by(Site.name.asc()).all())
    return sites


@router.post("/admin/select-site", response_model=AdminSelectSiteResponse)
def admin_select_site(data: AdminSelectSiteRequest,user=Depends(require_admin),db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == data.site_id,Site.status == "active",Site.is_deleted == False,).first()

    if not site:
        raise HTTPException(status_code=404, detail="Active site not found")

    inside, _, _ = is_within_geofence(
        data.latitude,
        data.longitude,
        site.latitude,
        site.longitude,
        site.geofence_radius,
        boundary_type=getattr(site, "boundary_type", "circle"),
        polygon_coords=getattr(site, "polygon_coords", None),
    )
    if not inside:
        raise HTTPException(status_code=403, detail="Outside geofence for selected site")

    token_data = {
        "sub": user.get("sub"),
        "role": "admin",
        "name": user.get("name") or "Admin",
        "selected_site_id": str(site.id),
        "selected_site_name": site.name,
        # Also set site_id/site_name for backward compatibility with existing mobile code.
        "site_id": str(site.id),
        "site_name": site.name,
    }

    scoped_token = create_access_token(token_data)

    return {
        "access_token": scoped_token,
        "role": "admin",
        "selected_site_id": str(site.id),
        "selected_site_name": site.name,
    }


# --------------------------------------------------
# V2 SITE SELECTION (admin + site_incharge, no user.site_id required)
# --------------------------------------------------
from app.core.dependencies import require_mobile_user_unscoped


@router.get("/v2/sites", response_model=list[MobileSiteOption])
def get_mobile_sites_v2(user=Depends(require_mobile_user_unscoped), db: Session = Depends(get_db)):
    """List active sites (for both admin and site_incharge).

    This endpoint is for the new APK flow where site_incharge is not bound to a site.
    """
    sites = (
        db.query(Site)
        .filter(Site.status == "active", Site.is_deleted == False)
        .order_by(Site.name.asc())
        .all()
    )
    return sites


@router.post("/v2/select-site", response_model=AdminSelectSiteResponse)
def select_site_v2(
    data: AdminSelectSiteRequest,
    user=Depends(require_mobile_user_unscoped),
    db: Session = Depends(get_db),
):
    """Validate geofence and return a scoped JWT containing selected_site_id.

    Backward compatible: also includes site_id/site_name in token.
    """
    site = (
        db.query(Site)
        .filter(
            Site.id == data.site_id,
            Site.status == "active",
            Site.is_deleted == False,
        )
        .first()
    )

    if not site:
        raise HTTPException(status_code=404, detail="Active site not found")

    inside, _, _ = is_within_geofence(
        data.latitude,
        data.longitude,
        site.latitude,
        site.longitude,
        site.geofence_radius,
        boundary_type=getattr(site, "boundary_type", "circle"),
        polygon_coords=getattr(site, "polygon_coords", None),
    )

    if not inside:
        raise HTTPException(status_code=403, detail="Outside geofence for selected site")

    role = user.get("role")
    if role not in {"admin", "site_incharge"}:
        raise HTTPException(status_code=403, detail="Invalid role")

    token_data = {
        "sub": user.get("sub"),
        "role": role,
        "name": user.get("name") or ("Admin" if role == "admin" else "Site Incharge"),
        "selected_site_id": str(site.id),
        "selected_site_name": site.name,
        # Backward compatibility
        "site_id": str(site.id),
        "site_name": site.name,
    }

    scoped_token = create_access_token(token_data)

    return {
        "access_token": scoped_token,
        "role": role,
        "selected_site_id": str(site.id),
        "selected_site_name": site.name,
    }


# --------------------------------------------------
# SITE DASHBOARD STATS
# --------------------------------------------------
@router.get("/dashboard/stats")
def get_site_dashboard_stats(user=Depends(require_mobile_user),db: Session = Depends(get_db)):
    site_id = get_site_id_or_raise(user)
    
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid Site")
    
    tz = pytz.timezone(site.timezone)
    today = datetime.now(tz).date()

    total_workers = db.query(Worker).filter(Worker.site_id == site_id,Worker.is_deleted == False).count()

    active_workers = db.query(Worker).filter(Worker.site_id == site_id,Worker.status == "active",Worker.is_deleted == False).count()

    present_today = db.query(AttendanceRecord).filter(AttendanceRecord.check_in_site_id == site_id,AttendanceRecord.date == today,AttendanceRecord.check_in_time.isnot(None)).count()

    absent_today = max(active_workers - present_today, 0)

    checked_out_today = db.query(AttendanceRecord).filter(AttendanceRecord.check_in_site_id == site_id,AttendanceRecord.date == today,AttendanceRecord.check_out_time.isnot(None)).count()

    # Workers with no face enrolled yet
    unenrolled_count = db.query(Worker).filter(Worker.site_id == site_id,Worker.status == "active",Worker.is_deleted == False,Worker.face_embedding == None).count()

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
def get_site_weekly_attendance(user=Depends(require_mobile_user),db: Session = Depends(get_db)):
    
    site_id = get_site_id_or_raise(user)

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid Site")
    
    today = datetime.now(pytz.timezone(site.timezone)).date()

    week_start = today - timedelta(days=6)

    present_results = (db.query(AttendanceRecord.date, func.count(AttendanceRecord.id)).filter(AttendanceRecord.check_in_site_id == site_id,AttendanceRecord.date >= week_start,AttendanceRecord.check_in_time.isnot(None)).group_by(AttendanceRecord.date).all())

    present_map = {r[0]: r[1] for r in present_results}

    # active workers count for absent calculation
    active_workers = db.query(Worker).filter(Worker.site_id == site_id,Worker.status == "active",Worker.is_deleted == False).count()

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
def get_site_recent_activity(user=Depends(require_mobile_user),db: Session = Depends(get_db)):
    site_id = get_site_id_or_raise(user)

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")

    records = (db.query(AttendanceRecord, Worker).join(Worker, Worker.id == AttendanceRecord.worker_id).filter(AttendanceRecord.check_in_site_id == site_id).order_by(AttendanceRecord.check_in_time.desc()).limit(8).all())

    result = []
    for r, worker in records:
        obj = serialize_attendance(r, site.timezone)

        result.append({
            "worker_id":   r.worker_id,
            "worker_name": worker.full_name if worker else "Unknown",
            "date":        str(obj.date),   # already local
            "check_in_time":  obj.check_in_time.strftime("%I:%M %p") if obj.check_in_time else None,
            "check_out_time": obj.check_out_time.strftime("%I:%M %p") if obj.check_out_time else None,
            "status":      obj.status,
            "total_hours": round(obj.total_hours, 1) if obj.total_hours else None,
        })

    return result


# --------------------------------------------------
# WORKERS LIST (all workers across all sites, with today's attendance status)
# --------------------------------------------------
@router.get("/site-workers")
def get_site_workers(search: str | None = Query(None),status: str | None = Query(None),user=Depends(require_mobile_user),db: Session = Depends(get_db)):

    site_id = get_site_id_or_raise(user)
    role   = user.get("role")
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")
    today = datetime.now(pytz.timezone(site.timezone)).date()

    # List ALL workers regardless of site — site incharge can work with any worker
    query = db.query(Worker).filter(Worker.is_deleted == False)

    if search:
        query = query.filter(or_(Worker.full_name.ilike(f"%{search}%"),Worker.mobile.ilike(f"%{search}%"),Worker.id.ilike(f"%{search}%")))

    if status:
        query = query.filter(Worker.status == status)

    workers = query.order_by(Worker.full_name).all()

    # Batch-fetch today's attendance for all returned workers — avoids N+1 queries
    worker_ids = [w.id for w in workers]
    today_attendances = {}
    if worker_ids:
        att_rows = db.query(AttendanceRecord).filter(AttendanceRecord.worker_id.in_(worker_ids),AttendanceRecord.date == today).all()
        today_attendances = {a.worker_id: a for a in att_rows}

    result = []
    for w in workers:
        attendance = today_attendances.get(w.id)

        if attendance and attendance.check_in_time:
            today_status = "checked_out" if attendance.check_out_time else "present"
        else:
            today_status = "absent"

        worker_data = serialize_worker_mobile(w, role)
        worker_data["today_status"] = today_status

        result.append(worker_data)

    return result


# --------------------------------------------------
# WORKER PROFILE PHOTO (SIGNED URL)
# --------------------------------------------------
@router.get("/workers/{worker_id}/photo", response_model=MobileWorkerPhotoResponse)
def get_mobile_worker_photo(
    worker_id: str,
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id,Worker.is_deleted == False).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    photo_key = resolve_worker_profile_photo_key(worker, db)
    if not photo_key:
        raise HTTPException(status_code=404, detail="Photo not found")

    return {"url": generate_presigned_download_url(photo_key)}


# --------------------------------------------------
# SITE ATTENDANCE LIST (with filters)
# --------------------------------------------------
@router.get("/site-attendance")
def get_site_attendance(
    worker_name: str | None = Query(None),
    date_from: str | None = Query(None),   # YYYY-MM-DD
    date_to: str | None = Query(None),     # YYYY-MM-DD
    sort_order: str = Query("desc"),       # "asc" | "desc"
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db)
):
    site_id = get_site_id_or_raise(user)
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")


    # Include attendance where this site handled either check-in or check-out.
    query = (db.query(AttendanceRecord, Worker).join(Worker, Worker.id == AttendanceRecord.worker_id).filter(or_(AttendanceRecord.check_in_site_id == site_id,AttendanceRecord.check_out_site_id == site_id,)))

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
        obj = serialize_attendance(r, site.timezone)
        result.append({
            "id": str(r.id),
            "worker_id": r.worker_id,
            "worker_name": w.full_name if w else "Unknown",
            "date": str(obj.date),
            "check_in_time": obj.check_in_time.strftime("%I:%M %p") if obj.check_in_time else None,
            "check_out_time": obj.check_out_time.strftime("%I:%M %p") if obj.check_out_time else None,
            "status": obj.status,
            "total_hours": round(obj.total_hours, 1) if obj.total_hours else None,
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
    user=Depends(require_mobile_user),
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
        **_audit_mobile(user),
    )

    return {"message": "Face enrolled successfully"}


@router.get("/workers", response_model=list[MobileWorkerResponse])
def get_workers(
    search: str | None = Query(None),
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db)
):
    # List ALL workers across all sites — site incharge can work with any worker
    query = db.query(Worker).filter(Worker.status == 'active')

    if search:
        query = query.filter(or_(Worker.full_name.ilike(f"%{search}%"),Worker.mobile.ilike(f"%{search}%"),Worker.id.ilike(f"%{search}%")))

    return query.all()


@router.post("/verify-geofence", response_model=GeofenceResponse)
def verify_geofence(data: LocationRequest, user=Depends(require_mobile_user), db: Session = Depends(get_db)):
    site_id = get_site_id_or_raise(user)

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
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db)
):

    site_id = get_site_id_or_raise(user)

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")
    print(f"Valid site and Site name : {site.name}")

    # Store timestamps as UTC-naive values because DB columns are `timestamp without time zone`.
    # Using aware datetimes here can lead to inconsistent math when values round-trip through DB.
    utc_now = datetime.utcnow()
    local_time = utc_now.replace(tzinfo=pytz.utc).astimezone(pytz.timezone(site.timezone))

    existing = db.query(AttendanceRecord).filter(AttendanceRecord.worker_id == worker_id,AttendanceRecord.date == local_time.date()).first()

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
    permanent_path = save_compressed_attendance_image(temp_path=temp_path,site_name=site_folder,worker_id=worker.id,mode="Checkin", timezone_str=site.timezone)

    # delete temp
    os.remove(temp_path)

    # 5️⃣ Create attendance record
    record = AttendanceRecord(
        worker_id=worker_id,
        check_in_site_id=site.id,
        project_id=site.project_id,
        date=local_time.date(),
        check_in_time=utc_now,
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
        **_audit_mobile(user),
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
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db)
):

    site_id = get_site_id_or_raise(user)

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        print("FAIL: Invalid site")
        raise HTTPException(400, "Invalid site")

    # Store timestamps as UTC-naive values because DB columns are `timestamp without time zone`.
    utc_now = datetime.utcnow()
    local_time = utc_now.replace(tzinfo=pytz.utc).astimezone(pytz.timezone(site.timezone))

    record = db.query(AttendanceRecord).filter(AttendanceRecord.worker_id == worker_id, AttendanceRecord.date == local_time.date()).first()

    if not record or not record.check_in_time:
        raise HTTPException(400, "No check-in found")

    if record.check_out_time:
        raise HTTPException(400, "Already checked out")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        print("FAIL: Worker not found")
        raise HTTPException(400, "Worker not found")

    # No site ownership check — a worker can check out at a different site than where they checked in

    if not worker.face_embedding:
        print("FAIL: Face not enrolled")
        raise HTTPException(400, "Worker face not enrolled")

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

    permanent_path = save_compressed_attendance_image(temp_path=temp_path,site_name=site_folder,worker_id=worker.id,mode="Checkout", timezone_str=site.timezone)

    os.remove(temp_path)

    record.check_out_site_id = site.id   # manager's current site — may differ from check-in site
    record.check_out_time = utc_now
    record.check_out_lat = latitude
    record.check_out_lng = longitude
    record.check_out_selfie_url = permanent_path
    record.status = "checked_out"
    record.geofence_valid = True

    # Calculate total hours and overtime
    try:
        if record.check_in_time and record.check_out_time:
            delta = record.check_out_time - record.check_in_time
            total_hours = math.floor(delta.total_seconds() / 3600)
        else:
            total_hours = 0
    except Exception:
        total_hours = 0

    record.total_hours = total_hours

    # compute overtime based on worker.daily_working_hours (nullable)
    dw_hours = getattr(worker, 'daily_working_hours', None) or 0
    overtime = max(0, total_hours - dw_hours)
    record.overtime_hours = overtime

    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="check_out",
        entity_type="attendance",
        entity_id=str(record.id),
        details=f"Worker {worker_id} ({worker.full_name}) checked out at site {site.name}. Hours: {round(record.total_hours or 0, 2)}",
        **_audit_mobile(user),
    )

    return record


# --------------------------------------------------
# OFFLINE-FIRST SYNC ENDPOINTS (do not break old APK)
# --------------------------------------------------

@router.get("/sync/workers")
def mobile_sync_workers(
    updated_after: str | None = Query(None, description="ISO datetime; return workers updated after this timestamp"),
    include_embeddings: bool = Query(True),
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db),
):
    """Return worker list for Room bootstrap (optionally including face_embedding).

    - Does NOT change existing /mobile/workers behavior.
    - Admin/site_incharge can fetch all active, non-deleted workers (cross-site).
    """
    q = db.query(Worker).filter(Worker.status == "active", Worker.is_deleted == False)

    if updated_after:
        try:
            dt = datetime.fromisoformat(updated_after.replace("Z", "+00:00"))
            # store updated_at as naive UTC in DB; compare using naive if tz-aware provided
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            q = q.filter(Worker.updated_at.isnot(None), Worker.updated_at > dt)
        except Exception:
            pass

    workers = q.order_by(Worker.full_name.asc()).all()

    def _serialize(w: Worker) -> dict:
        data = {
            "id": w.id,
            "full_name": w.full_name,
            "mobile": w.mobile,
            "status": w.status,
            "updated_at": w.updated_at.isoformat() if w.updated_at else None,
        }
        if include_embeddings:
            data["face_embedding"] = w.face_embedding
        return data

    return {
        "count": len(workers),
        "workers": [_serialize(w) for w in workers],
    }


@router.post("/offline/check-in", response_model=MobileAttendanceResponse)
def offline_check_in(
    worker_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    device_time_utc: str = Form(...),
    local_verified: bool = Form(...),
    similarity_score: float | None = Form(None),
    threshold: float | None = Form(None),
    device_attendance_id: str | None = Form(None),
    photo: UploadFile | None = File(None),
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db),
):
    """Store a locally-verified check-in (no server-side face verification).

    Rules:
    - If local_verified is False => do NOT create attendance record.
      Only write fail attempt to face_logs (auditing), then return 403.
    - Geofence is still validated server-side.
    - Photo is optional (can be uploaded later via /offline/selfie).
    """

    site_id = get_site_id_or_raise(user)
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")

    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    # Parse device time
    try:
        dt = datetime.fromisoformat(device_time_utc.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            utc_now = dt.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            # assume already UTC-naive
            utc_now = dt
    except Exception:
        # fallback on server time (still UTC-naive)
        utc_now = datetime.utcnow()

    local_time = utc_now.replace(tzinfo=pytz.utc).astimezone(pytz.timezone(site.timezone))

    # Audit local fail (no attendance record)
    if not local_verified:
        selfie_key = None
        if photo is not None:
            temp_path = f"/tmp/{uuid.uuid4()}.jpg"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            try:
                # Store failed attempt selfie separately for Media Repository review
                selfie_key = save_compressed_failed_face_image(
                    temp_path=temp_path,
                    site_name=format_site_folder(site.name),
                    worker_id=str(worker.id),
                    event_type="offline_check_in",
                    timezone_str=site.timezone,
                )
            finally:
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

        log_face(
            event_type="offline_check_in",
            worker_id=str(worker.id) if worker else str(worker_id),
            worker_name=worker.full_name if worker else "Unknown",
            site_id=str(site.id),
            site_name=site.name,
            similarity_score=similarity_score or 0.0,
            threshold=threshold or 0.0,
            result=False,
            embedding_length=0,
            notes="local_verified=false; attendance not created",
            selfie_object_key=selfie_key,
        )
        raise HTTPException(status_code=403, detail="Local verification failed")

    # Still validate geofence server-side
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
        event_type="offline_check_in",
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
        notes=f"device_attendance_id={device_attendance_id}",
    )
    if not inside:
        raise HTTPException(403, "Outside geofence")

    # Prevent duplicate check-in for the same local date
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker_id,
        AttendanceRecord.date == local_time.date(),
    ).first()
    if existing:
        raise HTTPException(400, "Already checked in today")

    # Face pass audit log (optional)
    log_face(
        event_type="offline_check_in",
        worker_id=str(worker.id),
        worker_name=worker.full_name,
        site_id=str(site.id),
        site_name=site.name,
        similarity_score=float(similarity_score) if similarity_score is not None else 0.0,
        threshold=float(threshold) if threshold is not None else float(os.getenv("THRESHOLD", 0.75)),
        result=True,
        embedding_length=0,
        notes=f"device_local_verification_passed device_attendance_id={device_attendance_id}",
    )

    selfie_key = None
    if photo is not None:
        temp_path = f"/tmp/{uuid.uuid4()}.jpg"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)

        site_folder = format_site_folder(site.name)
        selfie_key = save_compressed_attendance_image(
            temp_path=temp_path,
            site_name=site_folder,
            worker_id=worker.id,
            mode="Checkin",
            timezone_str=site.timezone,
        )
        try:
            os.remove(temp_path)
        except Exception:
            pass

    record = AttendanceRecord(
        worker_id=worker_id,
        check_in_site_id=site.id,
        project_id=site.project_id,
        date=local_time.date(),
        check_in_time=utc_now,
        check_in_lat=latitude,
        check_in_lng=longitude,
        check_in_selfie_url=selfie_key,
        status="checked_in",
        geofence_valid=True,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="offline_check_in",
        entity_type="attendance",
        entity_id=str(record.id),
        details=f"Offline check-in stored worker={worker.id} site={site.name} device_attendance_id={device_attendance_id}",
        **_audit_mobile(user),
    )

    return record


@router.post("/offline/check-out", response_model=MobileAttendanceResponse)
def offline_check_out(
    worker_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    device_time_utc: str = Form(...),
    local_verified: bool = Form(...),
    similarity_score: float | None = Form(None),
    threshold: float | None = Form(None),
    device_attendance_id: str | None = Form(None),
    photo: UploadFile | None = File(None),
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db),
):
    """Store a locally-verified check-out (no server-side face verification).

    - If local_verified is False => do NOT update attendance record.
      Only write fail attempt to face_logs and return 403.
    - Geofence is still validated.
    """

    site_id = get_site_id_or_raise(user)
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")

    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False).first()
    if not worker:
        raise HTTPException(404, "Worker not found")

    try:
        dt = datetime.fromisoformat(device_time_utc.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            utc_now = dt.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            utc_now = dt
    except Exception:
        utc_now = datetime.utcnow()

    local_time = utc_now.replace(tzinfo=pytz.utc).astimezone(pytz.timezone(site.timezone))

    if not local_verified:
        selfie_key = None
        if photo is not None:
            temp_path = f"/tmp/{uuid.uuid4()}.jpg"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            try:
                selfie_key = save_compressed_failed_face_image(
                    temp_path=temp_path,
                    site_name=format_site_folder(site.name),
                    worker_id=str(worker.id),
                    event_type="offline_check_out",
                    timezone_str=site.timezone,
                )
            finally:
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

        log_face(
            event_type="offline_check_out",
            worker_id=str(worker.id) if worker else str(worker_id),
            worker_name=worker.full_name if worker else "Unknown",
            site_id=str(site.id),
            site_name=site.name,
            similarity_score=similarity_score or 0.0,
            threshold=threshold or 0.0,
            result=False,
            embedding_length=0,
            notes="local_verified=false; attendance not updated",
            selfie_object_key=selfie_key,
        )
        raise HTTPException(status_code=403, detail="Local verification failed")

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker_id,
        AttendanceRecord.date == local_time.date(),
    ).first()

    if not record or not record.check_in_time:
        raise HTTPException(400, "No check-in found")

    if record.check_out_time:
        raise HTTPException(400, "Already checked out")

    log_face(
        event_type="offline_check_out",
        worker_id=str(worker.id),
        worker_name=worker.full_name,
        site_id=str(site.id),
        site_name=site.name,
        similarity_score=float(similarity_score) if similarity_score is not None else 0.0,
        threshold=float(threshold) if threshold is not None else float(os.getenv("THRESHOLD", 0.75)),
        result=True,
        embedding_length=0,
        notes=f"device_local_verification_passed device_attendance_id={device_attendance_id}",
    )

    selfie_key = None
    if photo is not None:
        temp_path = f"/tmp/{uuid.uuid4()}.jpg"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)

        site_folder = format_site_folder(site.name)
        selfie_key = save_compressed_attendance_image(
            temp_path=temp_path,
            site_name=site_folder,
            worker_id=worker.id,
            mode="Checkout",
            timezone_str=site.timezone,
        )
        try:
            os.remove(temp_path)
        except Exception:
            pass

    record.check_out_site_id = site.id
    record.check_out_time = utc_now
    record.check_out_lat = latitude
    record.check_out_lng = longitude
    if selfie_key:
        record.check_out_selfie_url = selfie_key
    record.status = "checked_out"
    record.geofence_valid = True

    try:
        if record.check_in_time and record.check_out_time:
            delta = record.check_out_time - record.check_in_time
            total_hours = math.floor(delta.total_seconds() / 3600)
        else:
            total_hours = 0
    except Exception:
        total_hours = 0

    record.total_hours = total_hours

    dw_hours = getattr(worker, "daily_working_hours", None) or 0
    record.overtime_hours = max(0, total_hours - dw_hours)

    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="offline_check_out",
        entity_type="attendance",
        entity_id=str(record.id),
        details=f"Offline check-out stored worker={worker.id} site={site.name} device_attendance_id={device_attendance_id}",
        **_audit_mobile(user),
    )

    return record


@router.post("/offline/selfie")
def offline_upload_selfie(
    attendance_id: str = Form(..., description="Server attendance id (UUID)"),
    mode: str = Form(..., description="Checkin|Checkout"),
    photo: UploadFile = File(...),
    user=Depends(require_mobile_user),
    db: Session = Depends(get_db),
):
    """Upload selfie later for an already-created attendance record."""

    site_id = get_site_id_or_raise(user)
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")

    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == attendance_id).first()
    if not record:
        raise HTTPException(404, "Attendance not found")

    # Store under current site's folder (manager current site)
    site_folder = format_site_folder(site.name)

    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    object_key = save_compressed_attendance_image(
        temp_path=temp_path,
        site_name=site_folder,
        worker_id=record.worker_id,
        mode=mode,
        timezone_str=site.timezone,
    )

    try:
        os.remove(temp_path)
    except Exception:
        pass

    if mode.lower() == "checkin":
        record.check_in_selfie_url = object_key
    else:
        record.check_out_selfie_url = object_key

    db.commit()

    return {"message": "Selfie uploaded", "object_key": object_key}


# --------------------------------------------------
# GEOFENCE SYNC ENDPOINT (for offline caching)
# --------------------------------------------------
@router.get("/sync/site")
def sync_site(user=Depends(require_mobile_user), db: Session = Depends(get_db)):
    site_id = get_site_id_or_raise(user)

    site = db.query(Site).filter(Site.id == site_id, Site.is_deleted == False).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return {
        "site": {
            "id": str(site.id),
            "name": site.name,
            "boundary_type": getattr(site, "boundary_type", "circle"),
            "latitude": site.latitude,
            "longitude": site.longitude,
            "geofence_radius": site.geofence_radius,
            "polygon_coords": getattr(site, "polygon_coords", None),
            "timezone": site.timezone,
            "updated_at": site.updated_at.isoformat() if getattr(site, "updated_at", None) else None,
        }
    }






