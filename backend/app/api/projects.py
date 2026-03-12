from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.site import Site
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.audit_service import log_action
from app.core.dependencies import require_admin
from datetime import datetime
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["Projects"])


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


@router.post("/", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        project = Project(**data.dict())
        db.add(project)
        db.commit()
        db.refresh(project)

        log_action(
            db=db,
            action="create",
            entity_type="project",
            entity_id=str(project.id),
            details=f"Project {project.name} created",
            **_audit_user(current_user),
        )

        return project

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Project with this code already exists"
        )

@router.get("/", dependencies=[Depends(require_admin)])
def list_projects(include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Project)

    if not include_deleted:
        query = query.filter(Project.is_deleted == False)

    return query.all()


@router.delete("/{project_id}/force-delete")
def force_delete_project(project_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    db.query(AttendanceRecord).filter(AttendanceRecord.project_id == project_id).delete()
    db.query(Worker).filter(Worker.project_id == project_id).delete()
    db.query(Site).filter(Site.project_id == project_id).delete()
    db.delete(project)
    db.commit()

    log_action(
        db=db,
        action="force_delete",
        entity_type="project",
        entity_id=str(project_id),
        details="Project permanently deleted with all linked data",
        **_audit_user(current_user),
    )

    return {"message": "Project permanently deleted"}


@router.get("/{project_id}/summary")
def project_summary(project_id: str, db: Session = Depends(get_db)):

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    total_sites = db.query(Site).filter(Site.project_id == project_id).count()
    total_workers = db.query(Worker).filter(Worker.project_id == project_id).count()
    total_attendance = db.query(AttendanceRecord).filter(
        AttendanceRecord.project_id == project_id
    ).count()

    return {
        "project": project,
        "total_sites": total_sites,
        "total_workers": total_workers,
        "total_attendance": total_attendance
    }

from datetime import date

@router.put("/{project_id}/status")
def update_project_status(
    project_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    allowed_transitions = {
        "active": ["inactive", "terminated", "completed"],
        "inactive": ["active", "terminated"],
        "upcoming": ["active", "terminated"],
        "completed": [],
        "terminated": []
    }

    current_status = project.status

    if status == current_status:
        raise HTTPException(status_code=400, detail=f"Project is already in '{current_status}' state")

    if status not in allowed_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status}'")

    if status not in allowed_transitions.get(current_status, []):
        raise HTTPException(status_code=400, detail=f"Cannot change project from '{current_status}' to '{status}'")

    project.status = status

    if status in ["completed", "terminated"]:
        project.end_date = date.today()

    if status == "active":
        project.end_date = None

    db.commit()
    db.refresh(project)

    log_action(
        db=db,
        action="update",
        entity_type="project",
        entity_id=str(project_id),
        details=f"Project status changed from {current_status} to {status}",
        **_audit_user(current_user),
    )

    return {
        "message": "Status updated successfully",
        "old_status": current_status,
        "new_status": status,
        "end_date": project.end_date
    }


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    try:
        project.name = data.name
        project.code = data.code
        project.description = data.description
        project.client_name = data.client_name
        project.start_date = data.start_date

        db.commit()
        db.refresh(project)

        log_action(
            db=db,
            action="update",
            entity_type="project",
            entity_id=str(project_id),
            details=f"Project {project.name} updated",
            **_audit_user(current_user),
        )

        return project

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Project with this code already exists")


@router.patch("/{project_id}/archive")
def archive_project(project_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if project.is_deleted:
        raise HTTPException(400, "Project already archived")

    project.is_deleted = True
    project.deleted_at = datetime.utcnow()
    project.status = "inactive"

    db.query(Site).filter(Site.project_id == project_id).update({"status": "inactive"})
    db.query(Worker).filter(Worker.project_id == project_id).update({"status": "inactive"})

    db.commit()

    log_action(
        db=db,
        action="archive",
        entity_type="project",
        entity_id=str(project_id),
        details=f"Project {project.name} archived and all linked entities deactivated",
        **_audit_user(current_user),
    )

    return {"message": "Project archived successfully"}


@router.patch("/{project_id}/restore")
def restore_project(project_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if not project.is_deleted:
        raise HTTPException(400, "Project is not archived")

    project.is_deleted = False
    project.deleted_at = None
    project.status = "active"

    db.query(Site).filter(Site.project_id == project_id).update({"status": "active"})
    db.query(Worker).filter(Worker.project_id == project_id).update({"status": "active"})

    db.commit()

    log_action(
        db=db,
        action="restore",
        entity_type="project",
        entity_id=str(project_id),
        details=f"Project {project.name} restored",
        **_audit_user(current_user),
    )

    return {"message": "Project restored successfully"}