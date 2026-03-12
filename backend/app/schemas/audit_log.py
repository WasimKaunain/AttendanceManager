from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.base import ORMBase


class AuditLogResponse(ORMBase):
    id: UUID
    action: str
    entity_type: str
    entity_id: Optional[str]
    details: Optional[str]
    performed_by: Optional[UUID] = None
    performed_by_name: Optional[str] = None
    performed_by_role: Optional[str] = None
    created_at: datetime
