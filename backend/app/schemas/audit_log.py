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
    created_at: datetime
