from uuid import UUID
from datetime import datetime
from typing import Optional

from app.schemas.base import ORMBase


# ==========================================================
# Face Recognition Logs
# ==========================================================

class FaceLogResponse(ORMBase):
    id: UUID

    created_at: datetime
    event_type: str

    worker_id: Optional[str] = None
    worker_name: Optional[str] = None

    site_id: Optional[str] = None
    site_name: Optional[str] = None

    similarity_score: Optional[float] = None
    threshold: Optional[float] = None

    result: bool

    embedding_length: Optional[int] = None
    selfie_object_key: Optional[str] = None

    notes: Optional[str] = None


class FaceLogListResponse(ORMBase):
    items: list[FaceLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# ==========================================================
# Geofence Logs
# ==========================================================

class GeofenceLogResponse(ORMBase):
    id: UUID

    created_at: datetime
    event_type: str

    worker_id: Optional[str] = None
    worker_name: Optional[str] = None

    site_id: Optional[str] = None
    site_name: Optional[str] = None

    boundary_type: Optional[str] = None

    site_lat: Optional[float] = None
    site_lng: Optional[float] = None

    worker_lat: Optional[float] = None
    worker_lng: Optional[float] = None

    distance_m: Optional[float] = None
    radius_m: Optional[float] = None

    polygon_points: Optional[int] = None

    result: bool

    notes: Optional[str] = None


class GeofenceLogListResponse(ORMBase):
    items: list[GeofenceLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int