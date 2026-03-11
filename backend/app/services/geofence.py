import math
import json
from typing import Optional, List, Any


# -------------------------------------------------------
# Circle check — Haversine distance
# -------------------------------------------------------
def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in metres between two lat/lng points."""
    R = 6371000  # Earth radius in metres
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# -------------------------------------------------------
# Polygon check — Ray Casting algorithm
# -------------------------------------------------------
def _point_in_polygon(lat: float, lon: float, polygon: List[Any]) -> bool:
    """
    Returns True if (lat, lon) is inside the polygon.
    polygon: list of {lat, lng} dicts (or [lat, lng] lists).
    Uses the ray-casting algorithm — no external libraries needed.
    """
    if not polygon or len(polygon) < 3:
        return False

    # Normalise each vertex to (x=lng, y=lat) floats
    def to_xy(p):
        if isinstance(p, dict):
            return float(p.get("lng", p.get("lon", 0))), float(p.get("lat", 0))
        return float(p[1]), float(p[0])  # [lat, lng] list

    vertices = [to_xy(p) for p in polygon]
    x, y = float(lon), float(lat)

    inside = False
    n = len(vertices)
    j = n - 1
    for i in range(n):
        xi, yi = vertices[i]
        xj, yj = vertices[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i

    return inside


# -------------------------------------------------------
# Main entry point — used by all mobile endpoints
# -------------------------------------------------------
def is_within_geofence(
    lat1: float,
    lon1: float,
    lat2: float,          # site centre lat
    lon2: float,          # site centre lng
    radius_m: float,
    boundary_type: Optional[str] = "circle",
    polygon_coords: Optional[List[Any]] = None,
) -> tuple[bool, float, int]:
    """
    Returns (inside: bool, distance_m: float, polygon_points: int).

    - boundary_type="circle"  → Haversine distance <= radius_m
    - boundary_type="polygon" → Ray-casting point-in-polygon check
    Falls back to circle check if polygon_coords is missing or invalid.
    """
    if boundary_type == "polygon" and polygon_coords:
        # Safely parse if stored as a JSON string instead of a list
        if isinstance(polygon_coords, str):
            try:
                polygon_coords = json.loads(polygon_coords)
            except Exception:
                polygon_coords = []

        if isinstance(polygon_coords, list) and len(polygon_coords) >= 3:
            result = _point_in_polygon(lat1, lon1, polygon_coords)
            distance = _haversine_distance(lat1, lon1, lat2, lon2)
            print(f"[GEOFENCE DEBUG] ── polygon check ({len(polygon_coords)} pts) → inside={result}, haversine_dist={distance:.2f}m")
            return result, distance, len(polygon_coords)
        else:
            print(f"[GEOFENCE DEBUG] ── polygon_coords invalid or < 3 points, falling back to circle")

    # Default: circle
    distance = _haversine_distance(lat1, lon1, lat2, lon2)
    print(f"[GEOFENCE DEBUG] ── haversine distance={distance:.2f}m, radius={radius_m}m → inside={distance <= radius_m}")
    return distance <= radius_m, distance, 0
