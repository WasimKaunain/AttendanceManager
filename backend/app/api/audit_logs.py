from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import SessionLocal
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse
from app.core.dependencies import require_admin

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
    dependencies=[Depends(require_admin)]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AuditLogResponse])
def list_audit_logs(
    action: str | None = None,
    entity_type: str | None = None,
    performed_by_name: str | None = None,   # filter by admin/site-incharge name (partial match)
    performed_by_role: str | None = None,   # "admin" | "site_incharge" | "system"
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    if performed_by_name:
        query = query.filter(AuditLog.performed_by_name.ilike(f"%{performed_by_name}%"))

    if performed_by_role:
        query = query.filter(AuditLog.performed_by_role == performed_by_role)

    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)

    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    offset = (page - 1) * limit

    logs = (
        query.order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return logs

