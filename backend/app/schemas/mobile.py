from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date
from app.schemas.base import ORMBase


# ----------------------------
# Worker (Mobile Response)
# ----------------------------
class MobileWorkerResponse(ORMBase):
    id: str
    full_name: str
    mobile: str
    site_id: Optional[UUID] = None
    status: Optional[str] = None


# ----------------------------
# Location Request
# ----------------------------
class LocationRequest(BaseModel):
    latitude: float
    longitude: float


# ----------------------------
# Geofence Response
# ----------------------------
class GeofenceResponse(BaseModel):
    inside: bool
    site_id: Optional[UUID] = None
    site_name: Optional[str] = None


# ----------------------------
# Face Enroll Response
# ----------------------------
class FaceEnrollResponse(BaseModel):
    message: str


# ----------------------------
# Mobile Attendance Response
# ----------------------------
class MobileAttendanceResponse(ORMBase):
    id: UUID
    worker_id: str
    site_id: UUID
    project_id: UUID
    date: date

    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

    status: Optional[str] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    is_late: Optional[bool] = None