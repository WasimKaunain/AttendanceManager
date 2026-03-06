import math


def is_within_geofence(lat1: float, lon1: float,lat2: float, lon2: float,radius_m: float) -> bool:
    R = 6371000  # Earth radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2)
        * math.sin(d_lambda / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    print("Distance from site:", distance, "meters")
    print("Site radius:", radius_m)
    return distance <= radius_m
