from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.services.audit_service import log_action
from app.db.session import SessionLocal
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteResponse, SiteUpdate
from app.core.dependencies import require_admin

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
def list_sites(db: Session = Depends(get_db)):
    return db.query(Site).all()

@router.get("/{site_id}", response_model=SiteResponse, dependencies=[Depends(require_admin)])
def get_site(site_id: UUID, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return site


@router.patch("/{site_id}", response_model=SiteResponse, dependencies=[Depends(require_admin)])
def update_site(site_id: UUID, data: SiteCreate, db: Session = Depends(get_db)):
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


@router.delete("/{site_id}", dependencies=[Depends(require_admin)])
def delete_site(site_id: UUID, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    db.delete(site)
    db.commit()

    #audit logging
    log_action(
    db=db,
    action="delete",
    entity_type="site",
    entity_id=str(site.id),
    details=f"Site {site.name} deleted"
    )

    return {"message": "Site deleted successfully"}

