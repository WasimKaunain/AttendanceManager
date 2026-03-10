from uuid import UUID
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel
from app.schemas.base import ORMBase


# -----------------------------
# Attendance Response
# -----------------------------
class AttendanceResponse(ORMBase):
    id: UUID
    worker_id: str

    check_in_site_id: Optional[UUID] = None
    check_out_site_id: Optional[UUID] = None

    project_id: UUID
    date: date

    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

    check_in_selfie_url: Optional[str] = None
    check_out_selfie_url: Optional[str] = None

    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None

    status: str
    is_late: Optional[bool] = None
    geofence_valid: Optional[bool] = None

