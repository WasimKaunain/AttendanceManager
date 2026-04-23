from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.services.audit_service import log_action
from app.db.session import SessionLocal
from app.models.site import Site
from app.models.attendance import AttendanceRecord
from app.models.worker import Worker
from app.schemas.site import SiteCreate, SiteResponse, SiteUpdate, ForceDeleteRequest, ArchiveRequest, ActionResponse
from app.core.dependencies import require_admin
from datetime import datetime
from sqlalchemy.exc import IntegrityError
import pytz

router = APIRouter(prefix="/sites", tags=["Sites"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _audit_user(user: dict) -> dict:
    return {
        "performed_by": UUID(user["sub"]) if user.get("sub") else None,
        "performed_by_name": user.get("name") or user.get("sub", "Unknown"),
        "performed_by_role": user.get("role", "admin"),
    }


@router.post("/", response_model=SiteResponse)
def create_site(data: SiteCreate,db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):


    existing = db.query(Site).filter(Site.name == data.name,Site.project_id == data.project_id,Site.is_deleted == False).first()

    if existing:
        raise HTTPException(status_code=400,detail="A site with this name already exists in the selected project.")

    try:
        site_data = data.dict()

        # 🔥 Validate timezone from input
        timezone_str = site_data.get("timezone")

        if not timezone_str:
            raise HTTPException(status_code=400,detail="Timezone is required")

        if timezone_str not in pytz.all_timezones:
            raise HTTPException(status_code=400,detail="Invalid timezone")

        site = Site(**site_data)

        # ✅ Set timezone directly (NO auto-detection)
        site.timezone = timezone_str

        db.add(site)
        db.commit()
        db.refresh(site)

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400,detail="Database error while creating site.")

    log_action(
        db=db,
        action="create",
        entity_type="site",
        entity_id=str(site.id),
        details=f"Site {site.name} created (timezone={site.timezone})",
        **_audit_user(current_user),
    )

    return site


@router.get("/", dependencies=[Depends(require_admin)])
def list_sites(include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Site)

    if not include_deleted:
        query = query.filter(Site.is_deleted == False)

    return query.all()

@router.get("/by-project/{project_id}")
def get_sites_by_project(project_id: UUID, db: Session = Depends(get_db)):

    sites = (db.query(Site).filter(Site.project_id == project_id,Site.is_deleted == False).order_by(Site.name).all())

    return sites

@router.get("/{site_id}", response_model=SiteResponse, dependencies=[Depends(require_admin)])
def get_site(site_id: UUID, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return site


@router.patch("/{site_id}", response_model=SiteResponse)
def update_site(site_id: UUID, data: SiteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)
    site.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(site)

    log_action(
        db=db,
        action="update",
        entity_type="site",
        entity_id=str(site.id),
        details=f"Site {site.name} updated",
        **_audit_user(current_user),
    )

    return site


@router.delete("/{site_id}/force-delete", response_model=SiteResponse)
def force_delete_site(site_id: UUID, payload: ForceDeleteRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(404, "Site not found")

    if payload.confirmation != site.name:
        raise HTTPException(400, "Confirmation text mismatch")

    db.query(AttendanceRecord).filter(
        (AttendanceRecord.check_in_site_id == site_id) |
        (AttendanceRecord.check_out_site_id == site_id)
    ).delete(synchronize_session=False)

    db.query(Worker).filter(Worker.site_id == site_id).delete()
    db.delete(site)
    db.commit()

    log_action(
        db=db,
        action="force_delete",
        entity_type="site",
        entity_id=str(site_id),
        details=payload.reason,
        **_audit_user(current_user),
    )

    return {"message": "Site permanently deleted"}

@router.patch("/{site_id}/archive", response_model=ActionResponse)
def archive_site(site_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(404, "Site not found")

    if site.is_deleted:
        raise HTTPException(400, "Site already archived")

    site.is_deleted = True
    site.deleted_at = datetime.utcnow()
    site.status = "inactive"

    db.query(Worker).filter(Worker.site_id == site_id).update({"status": "inactive"})

    db.commit()

    log_action(
        db=db,
        action="archive",
        entity_type="site",
        entity_id=str(site.id),
        details=f"Site {site.name} archived",
        **_audit_user(current_user),
    )

    return {"message": "Site archived successfully"}


@router.patch("/{site_id}/restore", response_model=ActionResponse)
def restore_site(site_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(404, "Site not found")

    if not site.is_deleted:
        raise HTTPException(400, "Site is not archived")

    site.is_deleted = False
    site.deleted_at = None
    site.deleted_by = None
    site.status = "active"

    db.query(Worker).filter(Worker.site_id == site_id).update({"status": "active"})

    db.commit()

    log_action(
        db=db,
        action="restore",
        entity_type="site",
        entity_id=str(site.id),
        details=f"Site {site.name} restored",
        **_audit_user(current_user),
    )

    return {"message": "Site restored successfully"}