from fastapi import APIRouter, Query
import requests

router = APIRouter(prefix="/geocode", tags=["Geocode"])


# -----------------------------
# SEARCH LOCATION (Forward)
# -----------------------------
@router.get("/search")
def search_location(q: str = Query(..., min_length=3)):
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "format": "json",
        "q": q,
        "addressdetails": 1,
        "limit": 10,          # more results so remote areas aren't cut off
        "dedupe": 0,          # include near-duplicate results (helps with villages)
        "accept-language": "en",  # force English names
    }

    headers = {
        "User-Agent": "attendance-manager-app",
        "Accept-Language": "en",  # English names in response
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code != 200:
        return []

    return response.json()


# -----------------------------
# REVERSE GEOCODING
# -----------------------------
@router.get("/reverse")
def reverse_location(lat: float, lon: float):
    url = "https://nominatim.openstreetmap.org/reverse"

    params = {
        "format": "json",
        "lat": lat,
        "lon": lon,
        "accept-language": "en",  # force English address names
    }

    headers = {
        "User-Agent": "attendance-manager-app",
        "Accept-Language": "en",
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code != 200:
        return {}

    return response.json()
