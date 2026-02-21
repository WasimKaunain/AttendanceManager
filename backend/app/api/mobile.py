from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import SessionLocal
from app.services.face_service import extract_face_embedding
from app.services.audit_service import log_action
from app.services.geofence import is_within_geofence
from app.services.face_service import is_same_person
import uuid, shutil, math, os
from datetime import datetime, date
from app.models.worker import Worker
from app.models.site import Site
from app.models.attendance import AttendanceRecord
from app.core.dependencies import require_site_manager
from app.schemas.mobile import (MobileWorkerResponse,LocationRequest,GeofenceResponse,FaceEnrollResponse,MobileAttendanceResponse)
from app.services.image_service import save_compressed_attendance_image

router = APIRouter(prefix="/mobile", tags=["Mobile"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# ENROLL FACE
# --------------------------------------------------

UPLOAD_DIR = "uploads/enrolled_faces"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/enroll-face/{worker_id}", response_model=FaceEnrollResponse)
def enroll_face(worker_id: str,photo: UploadFile = File(...),user=Depends(require_site_manager),db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # 1️⃣ Save temporarily
    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    # 2️⃣ Extract embedding
    embedding = extract_face_embedding(temp_path)

    if not embedding:
        os.remove(temp_path)
        raise HTTPException(400, "No face detected")

    # 3️⃣ Save permanent enrolled image
    permanent_path = os.path.join(UPLOAD_DIR, f"{worker.id}.jpg")
    shutil.move(temp_path, permanent_path)

    # 4️⃣ Update worker record
    worker.face_embedding = embedding
    worker.photo_url = permanent_path

    db.commit()

    log_action(
        db=db,
        action="face_enrolled",
        entity_type="worker",
        entity_id=worker.id,
        details=f"Worker {worker.full_name} face enrolled (mobile)"
    )

    return {"message": "Face enrolled successfully"}


@router.get("/workers", response_model=list[MobileWorkerResponse])
def get_workers(
    search: str | None = Query(None),
    site_id: str | None = Query(None),
    user=Depends(require_site_manager),
    db: Session = Depends(get_db)
):
    query = db.query(Worker)

    if search:
        query = query.filter(
            or_(
                Worker.full_name.ilike(f"%{search}%"),
                Worker.mobile.ilike(f"%{search}%"),
                Worker.id.ilike(f"%{search}%")
            )
        )

    if site_id:
        query = query.filter(Worker.site_id == site_id)

    return query.all()


def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + \
        math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


@router.post("/verify-geofence", response_model=GeofenceResponse)
def verify_geofence(
    data: LocationRequest,
    user=Depends(require_site_manager),
    db: Session = Depends(get_db)
):
    site_id = user.get("site_id")

    if not site_id:
        return GeofenceResponse(
            inside=False,
            site_id=None,
            site_name=None
        )

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        return GeofenceResponse(
            inside=False,
            site_id=None,
            site_name=None
        )

    distance = calculate_distance(
        data.latitude,
        data.longitude,
        site.latitude,
        site.longitude
    )

    if distance <= site.geofence_radius:
        return GeofenceResponse(
            inside=True,
            site_id=site.id,
            site_name=site.name
        )

    return GeofenceResponse(
        inside=False,
        site_id=site.id,
        site_name=site.name
    )

# ===================== CHECK-IN =====================

@router.post("/check-in", response_model=MobileAttendanceResponse)
def check_in(
    worker_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    photo: UploadFile = File(...),
    user=Depends(require_site_manager),
    db: Session = Depends(get_db)
):
    today = date.today()

    site_id = user.get("site_id")
    if not site_id:
        raise HTTPException(403, "Site not assigned")

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")

    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker_id,
        AttendanceRecord.date == today
    ).first()

    if existing:
        raise HTTPException(400, "Already checked in today")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker or not worker.face_embedding:
        raise HTTPException(400, "Worker face not enrolled")

    # 1️⃣ Save temporarily
    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    # 2️⃣ Extract face embedding
    live_embedding = extract_face_embedding(temp_path)

    if not live_embedding:
        os.remove(temp_path)
        raise HTTPException(400, "No face detected")

    if not is_same_person(live_embedding, worker.face_embedding):
        os.remove(temp_path)
        raise HTTPException(403, "Face verification failed")

    # 3️⃣ Geofence validation
    if not is_within_geofence(
        latitude,
        longitude,
        site.latitude,
        site.longitude,
        site.geofence_radius
    ):
        os.remove(temp_path)
        raise HTTPException(403, "Outside geofence")

    # 4️⃣ Save compressed to structured folder
    permanent_path = save_compressed_attendance_image(
        temp_path=temp_path,
        worker_name=worker.full_name,
        mode="Checkin"
    )

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
        details=f"Worker {worker_id} checked in (mobile)"
    )

    return record


# ===================== CHECK-OUT =====================

@router.post("/check-out", response_model=MobileAttendanceResponse)
def check_out(
    worker_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    photo: UploadFile = File(...),
    user=Depends(require_site_manager),
    db: Session = Depends(get_db)
):
    today = date.today()

    # 1️⃣ Get site from logged-in manager
    site_id = user.get("site_id")
    if not site_id:
        raise HTTPException(403, "Site not assigned")

    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(400, "Invalid site")

    # 2️⃣ Fetch attendance record
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker_id,
        AttendanceRecord.date == today
    ).first()

    if not record or not record.check_in_time:
        raise HTTPException(400, "No check-in found")

    if record.check_out_time:
        raise HTTPException(400, "Already checked out")

    # 3️⃣ Validate worker & face enrollment
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker or not worker.face_embedding:
        raise HTTPException(400, "Worker face not enrolled")

    # 4️⃣ Save temporarily
    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    # 5️⃣ Extract face embedding
    live_embedding = extract_face_embedding(temp_path)

    if not live_embedding:
        os.remove(temp_path)
        raise HTTPException(400, "No face detected")

    if not is_same_person(live_embedding, worker.face_embedding):
        os.remove(temp_path)
        raise HTTPException(403, "Face verification failed")

    # 6️⃣ Geofence validation
    if not is_within_geofence(
        latitude,
        longitude,
        site.latitude,
        site.longitude,
        site.geofence_radius
    ):
        os.remove(temp_path)
        raise HTTPException(403, "Outside geofence")

    # 4️⃣ Save compressed to structured folder
    permanent_path = save_compressed_attendance_image(
        temp_path=temp_path,
        worker_name=worker.full_name,
        mode="Checkin"
    )
    
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
    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="check_out",
        entity_type="attendance",
        entity_id=str(record.id),
        details=f"Worker {worker_id} checked out (mobile)"
    )

    return record