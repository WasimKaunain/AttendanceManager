from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from app.schemas.base import ORMBase

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
    status: Optional[str] = None


# -----------------------------
# Response Schema
# -----------------------------
class SiteResponse(ORMBase, SiteBase):
    id: UUID