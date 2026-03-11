from sqlalchemy import Column, String, Float, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base

class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(String)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geofence_radius = Column(Float, default=200)
    # boundary_type: "circle" (uses lat/lng + geofence_radius) or "polygon" (uses polygon_coords)
    boundary_type = Column(String, default="circle", nullable=False, server_default="circle")
    # polygon_coords: list of {lat, lng} dicts, used when boundary_type = "polygon"
    polygon_coords = Column(JSON, nullable=True)
    status = Column(String, default="active")
    is_deleted = Column(Boolean, nullable=False, default=False, server_default="false")  # soft delete flag
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String, nullable=True)
