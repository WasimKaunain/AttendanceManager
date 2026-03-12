from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String)
    details = Column(String)
    performed_by = Column(UUID(as_uuid=True), nullable=True)
    performed_by_name = Column(String, nullable=True)   # Human-readable name (admin/site incharge)
    performed_by_role = Column(String, nullable=True)   # "admin" | "site_incharge" | "system"
    created_at = Column(DateTime, default=datetime.utcnow)
