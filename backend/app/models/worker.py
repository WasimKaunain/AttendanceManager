from sqlalchemy import Column, String, Float, ForeignKey, Date, Boolean, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import date
from app.db.base import Base
from sqlalchemy.dialects.postgresql import UUID

class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True)  # Custom EMP ID

    full_name = Column(String, nullable=False)
    mobile = Column(String, unique=True,nullable=False)
    id_number = Column(String, unique=True, nullable=False)

    joining_date = Column(Date, default=date.today)

    photo_url = Column(String)
    id_url = Column(String)
    face_embedding = Column(ARRAY(Float))

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"))
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"))

    role = Column(String, default="laborer")
    type = Column(String, default="permanent")  # permanent, contract
    status = Column(String, default="active")

    daily_rate = Column(Float)
    hourly_rate = Column(Float)
    monthly_salary = Column(Float)

    is_deleted = Column(Boolean, nullable=False, default=False, server_default="false")  # soft delete flag
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String, nullable=True)
