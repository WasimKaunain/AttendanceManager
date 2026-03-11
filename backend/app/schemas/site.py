from uuid import UUID
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.schemas.base import ORMBase
from datetime import datetime

# -----------------------------
# Base Schema (shared fields)
# -----------------------------
class SiteBase(BaseModel):
    name: str
    project_id: UUID
    address: Optional[str] = None
    latitude: float
    longitude: float
    geofence_radius: float = 200
    boundary_type: Optional[str] = "circle"   # "circle" | "polygon"
    polygon_coords: Optional[List[Any]] = None  # [{lat, lng}, ...]
    status: Optional[str] = "active"


# -----------------------------
# Create Schema
# -----------------------------
class SiteCreate(SiteBase):
    pass


# -----------------------------
# Update Schema (PATCH)
# -----------------------------
class SiteUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[UUID] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geofence_radius: Optional[float] = None
    boundary_type: Optional[str] = None
    polygon_coords: Optional[List[Any]] = None
    status: Optional[str] = None


# -----------------------------
# Response Schema
# -----------------------------
class SiteResponse(ORMBase, SiteBase):
    id: UUID
    is_deleted : bool
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None


class ArchiveRequest(BaseModel):
    reason: str = Field(..., min_length=5)

class ForceDeleteRequest(BaseModel):
    reason: str = Field(..., min_length=5)
    confirmation: str

class ActionResponse(BaseModel):
    message: str