from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.schemas.base import ORMBase


# ----------------------------
# Admin Site Context (Mobile)
# ----------------------------
class MobileSiteOption(BaseModel):
    id: UUID
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    geofence_radius: Optional[float] = None


class AdminSelectSiteRequest(BaseModel):
    site_id: UUID
    latitude: float
    longitude: float


class AdminSelectSiteResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    selected_site_id: str
    selected_site_name: str


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
# Embedding Payload (Used Internally)
# ----------------------------
class EmbeddingPayload(BaseModel):
    embedding: List[float] = Field(..., min_length=64)


# ----------------------------
# Mobile Attendance Response
# ----------------------------
class MobileAttendanceResponse(ORMBase):
    id: UUID
    worker_id: str

    check_in_site_id: Optional[UUID] = None
    check_out_site_id: Optional[UUID] = None

    project_id: Optional[UUID] = None
    date: date

    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

    status: Optional[str] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    is_late: Optional[bool] = None