"""
DB-backed debug loggers for face verification and geofence checks.
Writes to:  geofence_logs  and  face_logs  tables in PostgreSQL.
These persist across Render restarts and redeploys.
"""

from app.db.session import SessionLocal
from app.models.debug_log import GeofenceLog, FaceLog


def log_face(
    event_type: str,
    worker_id: str,
    worker_name: str,
    site_id: str,
    site_name: str,
    similarity_score: float,
    threshold: float,
    result: bool,
    embedding_length: int = 0,
    notes: str = "",
) -> None:
    """Insert one row into face_logs. Silently ignores DB errors."""
    try:
        db = SessionLocal()
        db.add(FaceLog(
            event_type=event_type,
            worker_id=worker_id,
            worker_name=worker_name,
            site_id=site_id,
            site_name=site_name,
            similarity_score=similarity_score,
            threshold=threshold,
            result=result,
            embedding_length=embedding_length,
            notes=notes,
        ))
        db.commit()
    except Exception as e:
        print(f"[DEBUG_LOGGER] face_log write failed: {e}")
    finally:
        db.close()


def log_geofence(
    event_type: str,
    worker_id: str,
    worker_name: str,
    site_id: str,
    site_name: str,
    boundary_type: str,
    site_lat: float,
    site_lng: float,
    worker_lat: float,
    worker_lng: float,
    distance_m: float,
    radius_m: float,
    polygon_points: int,
    result: bool,
    notes: str = "",
) -> None:
    """Insert one row into geofence_logs. Silently ignores DB errors."""
    try:
        db = SessionLocal()
        db.add(GeofenceLog(
            event_type=event_type,
            worker_id=worker_id,
            worker_name=worker_name,
            site_id=site_id,
            site_name=site_name,
            boundary_type=boundary_type or "circle",
            site_lat=site_lat,
            site_lng=site_lng,
            worker_lat=worker_lat,
            worker_lng=worker_lng,
            distance_m=distance_m,
            radius_m=radius_m,
            polygon_points=polygon_points,
            result=result,
            notes=notes,
        ))
        db.commit()
    except Exception as e:
        print(f"[DEBUG_LOGGER] geofence_log write failed: {e}")
    finally:
        db.close()
