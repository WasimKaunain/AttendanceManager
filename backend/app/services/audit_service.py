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
    performed_by_name: Optional[str] = None,
    performed_by_role: Optional[str] = None,
):
    """
    Log an auditable action.

    Args:
        performed_by:       UUID of the user who triggered this action (optional).
        performed_by_name:  Human-readable display name — admin's employee_name or
                            site incharge's employee_name / username.
        performed_by_role:  "admin" | "site_incharge" | "system"
    """
    log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        performed_by=performed_by,
        performed_by_name=performed_by_name if performed_by_name else "Unknown",
        performed_by_role=performed_by_role if performed_by_role else "admin",
    )

    db.add(log)
    db.commit()
