"""
Debug CSV loggers for face verification and geofence checks.
Two files are written to the /logs/ folder at the project root:
  - logs/face_verification.csv
  - logs/geofence_checks.csv

These files persist across restarts (append mode) and are useful
for diagnosing face similarity thresholds and GPS accuracy issues.
"""

import csv
import os
from datetime import datetime

# ── Resolve log directory relative to this file ──────────────────────────────
_BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_LOG_DIR    = os.path.join(_BASE_DIR, "logs")
os.makedirs(_LOG_DIR, exist_ok=True)

FACE_LOG_PATH     = os.path.join(_LOG_DIR, "face_verification.csv")
GEOFENCE_LOG_PATH = os.path.join(_LOG_DIR, "geofence_checks.csv")

# ── Face log headers ──────────────────────────────────────────────────────────
_FACE_HEADERS = [
    "timestamp",
    "event_type",        # check_in | check_out
    "worker_id",
    "worker_name",
    "site_id",
    "site_name",
    "similarity_score",
    "threshold",
    "result",            # PASS | FAIL
    "embedding_length",  # sanity check — should always be same
    "notes",
]

# ── Geofence log headers ──────────────────────────────────────────────────────
_GEOFENCE_HEADERS = [
    "timestamp",
    "event_type",        # check_in | check_out | verify_geofence
    "worker_id",
    "worker_name",
    "site_id",
    "site_name",
    "boundary_type",     # circle | polygon
    "site_lat",
    "site_lng",
    "worker_lat",
    "worker_lng",
    "distance_m",        # haversine distance (circle) or N/A (polygon)
    "radius_m",          # configured radius
    "polygon_points",    # number of polygon vertices (polygon mode)
    "result",            # INSIDE | OUTSIDE
    "notes",
]


def _ensure_headers(filepath: str, headers: list[str]) -> None:
    """Write headers if the file doesn't exist yet."""
    if not os.path.exists(filepath):
        with open(filepath, "w", newline="") as f:
            csv.writer(f).writerow(headers)


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
    """Append one row to face_verification.csv."""
    _ensure_headers(FACE_LOG_PATH, _FACE_HEADERS)
    with open(FACE_LOG_PATH, "a", newline="") as f:
        csv.writer(f).writerow([
            datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            event_type,
            worker_id,
            worker_name,
            site_id,
            site_name,
            f"{similarity_score:.6f}",
            f"{threshold:.4f}",
            "PASS" if result else "FAIL",
            embedding_length,
            notes,
        ])


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
    """Append one row to geofence_checks.csv."""
    _ensure_headers(GEOFENCE_LOG_PATH, _GEOFENCE_HEADERS)
    with open(GEOFENCE_LOG_PATH, "a", newline="") as f:
        csv.writer(f).writerow([
            datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            event_type,
            worker_id,
            worker_name,
            site_id,
            site_name,
            boundary_type or "circle",
            site_lat,
            site_lng,
            worker_lat,
            worker_lng,
            f"{distance_m:.2f}" if distance_m is not None else "N/A",
            radius_m,
            polygon_points,
            "INSIDE" if result else "OUTSIDE",
            notes,
        ])
