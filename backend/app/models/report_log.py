from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import Base
from sqlalchemy.types import JSON

class ReportLog(Base):
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    report_type = Column(String)
    generated_by = Column(UUID)
    generated_at = Column(DateTime)
    filters = Column(JSON)
