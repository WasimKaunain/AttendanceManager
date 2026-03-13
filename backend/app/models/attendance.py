from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import Base

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    worker_id = Column(String, ForeignKey("workers.id"),nullable=False)
    check_in_site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=False)
    check_out_site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    date = Column(Date, nullable=False)

    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)

    check_in_lat = Column(Float)
    check_in_lng = Column(Float)
    check_out_lat = Column(Float)
    check_out_lng = Column(Float)

    check_in_selfie_url = Column(String)
    check_out_selfie_url = Column(String)

    status = Column(String)
    is_late = Column(Boolean, nullable=True, default=None)
    geofence_valid = Column(Boolean, default=True)

    total_hours = Column(Float)
    overtime_hours = Column(Float, default=0)
