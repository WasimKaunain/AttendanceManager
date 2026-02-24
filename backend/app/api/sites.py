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

router = APIRouter(prefix="/sites", tags=["Sites"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SiteResponse, dependencies=[Depends(require_admin)])
def create_site(data: SiteCreate, db: Session = Depends(get_db)):
    site = Site(**data.dict())
    db.add(site)
    db.commit()
    db.refresh(site)

    #audit logging
    log_action(
    db=db,
    action="create",
    entity_type="site",
    entity_id=str(site.id),
    details=f"Site {site.name} created"
)

    return site


@router.get("/", dependencies=[Depends(require_admin)])
def list_sites(include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Site)

    if not include_deleted:
        query = query.filter(Site.is_deleted == False)

    return query.all()

@router.get("/{site_id}", response_model=SiteResponse, dependencies=[Depends(require_admin)])
def get_site(site_id: UUID, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return site


@router.patch("/{site_id}", response_model=SiteResponse, dependencies=[Depends(require_admin)])
def update_site(site_id: UUID, data: SiteUpdate, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)

    db.commit()
    db.refresh(site)

    #audit logging
    log_action(
    db=db,
    action="update",
    entity_type="site",
    entity_id=str(site.id),
    details=f"Site {site.name} updated"
)

    return site


@router.delete("/{site_id}/force-delete",response_model=SiteResponse,dependencies=[Depends(require_admin)])
def force_delete_site(site_id: UUID,payload: ForceDeleteRequest, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(404, "Site not found")

    if payload.confirmation != site.name:
        raise HTTPException(400, "Confirmation text mismatch")

    # Delete attendance linked to site
    db.query(AttendanceRecord).filter(AttendanceRecord.site_id == site_id).delete()

    # Delete workers
    db.query(Worker).filter(Worker.site_id == site_id).delete()

    # Delete site
    db.delete(site)
    db.commit()

    log_action(
        db=db,
        action="force_delete",
        entity_type="site",
        entity_id=str(site_id),
        details=payload.reason
    )

    return {"message": "Site permanently deleted"}

@router.patch("/{site_id}/archive",response_model=ActionResponse,dependencies=[Depends(require_admin)])
def archive_site(site_id: UUID, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(404, "Site not found")

    if site.is_deleted:
        raise HTTPException(400, "Site already archived")

    # Soft delete site
    site.is_deleted = True
    site.deleted_at = datetime.utcnow()
    site.status = "inactive"

    # Deactivate workers linked to this site
    db.query(Worker).filter(Worker.site_id == site_id).update({"status": "inactive"})

    db.commit()

    log_action(
        db=db,
        action="archive",
        entity_type="site",
        entity_id=str(site.id),
        details=f"Site {site.name} archived"
    )

    return {"message": "Site archived successfully"}


@router.patch("/{site_id}/restore",response_model=ActionResponse, dependencies=[Depends(require_admin)])
def restore_site(site_id: UUID, db: Session = Depends(get_db)):

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(404, "Site not found")

    if not site.is_deleted:
        raise HTTPException(400, "Site is not archived")

    site.is_deleted = False
    site.deleted_at = None
    site.deleted_by = None
    site.status = "active"

    # Reactivate workers linked to this site
    db.query(Worker).filter(Worker.site_id == site_id).update({"status": "active"})

    db.commit()

    log_action(
        db=db,
        action="restore",
        entity_type="site",
        entity_id=str(site.id),
        details=f"Site {site.name} restored"
    )

    return {"message": "Site restored successfully"}