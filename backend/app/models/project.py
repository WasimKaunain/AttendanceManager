
from xmlrpc import server
from sqlalchemy import Column, String, Date, Boolean, DateTime
from app.db.base import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID
from datetime import date

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, unique=True)
    description = Column(String)
    client_name = Column(String)
    status = Column(String, default="active")  # inactive, completed, terminated
    start_date = Column(Date, default=date.today)
    end_date = Column(Date)

    updated_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False, server_default="false")  # soft delete flag
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String, nullable=True)
