from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from datetime import datetime
import uuid


class GeofenceLog(Base):
    """Every geofence check — verify-geofence, check-in, check-out."""
    __tablename__ = "geofence_logs"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    event_type     = Column(String, nullable=False)   # verify_geofence | check_in | check_out
    worker_id      = Column(String, nullable=True)
    worker_name    = Column(String, nullable=True)
    site_id        = Column(String, nullable=True)
    site_name      = Column(String, nullable=True)

    boundary_type  = Column(String, nullable=True)    # circle | polygon
    site_lat       = Column(Float,  nullable=True)
    site_lng       = Column(Float,  nullable=True)
    worker_lat     = Column(Float,  nullable=True)
    worker_lng     = Column(Float,  nullable=True)
    distance_m     = Column(Float,  nullable=True)    # haversine distance in metres
    radius_m       = Column(Float,  nullable=True)
    polygon_points = Column(Integer, nullable=True)   # 0 for circle
    result         = Column(Boolean, nullable=False)  # True = INSIDE, False = OUTSIDE
    notes          = Column(Text,   nullable=True)


class FaceLog(Base):
    """Every face verification attempt — check-in and check-out."""
    __tablename__ = "face_logs"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    event_type       = Column(String, nullable=False)  # check_in | check_out
    worker_id        = Column(String, nullable=True)
    worker_name      = Column(String, nullable=True)
    site_id          = Column(String, nullable=True)
    site_name        = Column(String, nullable=True)

    similarity_score = Column(Float,  nullable=True)
    threshold        = Column(Float,  nullable=True)
    result           = Column(Boolean, nullable=False)  # True = PASS, False = FAIL
    embedding_length = Column(Integer, nullable=True)
    notes            = Column(Text,   nullable=True)
