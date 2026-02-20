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
        "limit": 5,
    }

    headers = {
        "User-Agent": "attendance-manager-app"
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
    }

    headers = {
        "User-Agent": "attendance-manager-app"
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code != 200:
        return {}

    return response.json()
