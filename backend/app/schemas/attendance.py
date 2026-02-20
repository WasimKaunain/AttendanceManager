from uuid import UUID
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.schemas.base import ORMBase


# -----------------------------
# Base Location Schema
# -----------------------------
class LocationBase(BaseModel):
    worker_id: str   # if worker ID is custom string (EMPxxxx)
    site_id: UUID

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


# -----------------------------
# Check In Request
# -----------------------------
class CheckInRequest(LocationBase):
    pass


# -----------------------------
# Check Out Request
# -----------------------------
class CheckOutRequest(LocationBase):
    pass


# -----------------------------
# Attendance Response
# -----------------------------
class AttendanceResponse(ORMBase):
    id: UUID
    worker_id: str
    site_id: UUID
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