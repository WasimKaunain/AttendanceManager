from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from uuid import UUID
from typing import Optional


def log_action(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    performed_by: Optional[UUID] = None,
):
    log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        performed_by=performed_by,
    )

    db.add(log)
    db.commit()
