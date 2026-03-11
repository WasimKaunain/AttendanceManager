import os
from fastapi import APIRouter, Query, HTTPException
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/geocode", tags=["Geocode"])


def _get_google_key() -> str:
    """Always re-reads from environment so key is picked up after .env changes."""
    return os.getenv("GOOGLE_MAPS_API_KEY", "")


# -------------------------------------------------------
# AUTOCOMPLETE  (Google Places Autocomplete)
# -------------------------------------------------------
@router.get("/autocomplete")
def autocomplete(q: str = Query(..., min_length=2)):
    """
    Returns up to 5 place autocomplete predictions from Google Places API.
    Used for the search box in the site map picker.
    """
    GOOGLE_API_KEY = _get_google_key()
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_MAPS_API_KEY not configured on server.")

    url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    params = {
        "input": q,
        "key": GOOGLE_API_KEY,
        "language": "en",
        "region": "us",
        "types": "geocode|establishment",
    }

    resp = requests.get(url, params=params, timeout=5)
    if resp.status_code != 200:
        return []

    data = resp.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        # Log the error status for debugging
        import logging
        logging.warning(f"Google Places Autocomplete error: {data.get('status')} - {data.get('error_message', '')}")
        return []

    predictions = data.get("predictions", [])

    # Return minimal shape: { place_id, description }
    return [
        {"place_id": p["place_id"], "description": p["description"]}
        for p in predictions
    ]


# -------------------------------------------------------
# PLACE DETAILS  (lat/lng from a place_id)
# -------------------------------------------------------
@router.get("/place")
def place_details(place_id: str = Query(...)):
    """
    Returns lat/lng + formatted address for a Google place_id.
    Called after user selects an autocomplete suggestion.
    """
    GOOGLE_API_KEY = _get_google_key()
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_MAPS_API_KEY not configured on server.")

    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "geometry,formatted_address,name",
        "key": GOOGLE_API_KEY,
        "language": "en",
    }

    resp = requests.get(url, params=params, timeout=5)
    if resp.status_code != 200:
        return {}

    data = resp.json().get("result", {})
    loc = data.get("geometry", {}).get("location", {})

    return {
        "lat": loc.get("lat"),
        "lng": loc.get("lng"),
        "address": data.get("formatted_address", data.get("name", "")),
    }


# -------------------------------------------------------
# REVERSE GEOCODING  (Google Geocoding API)
# -------------------------------------------------------
@router.get("/reverse")
def reverse_location(lat: float, lon: float):
    """
    Returns human-readable address from lat/lng via Google Geocoding API.
    Falls back to Nominatim if Google key is not configured.
    """
    GOOGLE_API_KEY = _get_google_key()
    if GOOGLE_API_KEY:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{lat},{lon}",
            "key": GOOGLE_API_KEY,
            "language": "en",
        }
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            if results:
                return {"display_name": results[0].get("formatted_address", "")}

    # Fallback: Nominatim
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "format": "json",
        "lat": lat,
        "lon": lon,
        "accept-language": "en",
    }
    headers = {"User-Agent": "attendance-manager-app"}
    resp = requests.get(url, params=params, headers=headers, timeout=5)
    if resp.status_code != 200:
        return {}
    return resp.json()


# -------------------------------------------------------
# SEARCH (legacy Nominatim — kept as fallback)
# -------------------------------------------------------
@router.get("/search")
def search_location(q: str = Query(..., min_length=3)):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "format": "json",
        "q": q,
        "addressdetails": 1,
        "limit": 10,
        "dedupe": 0,
        "accept-language": "en",
    }
    headers = {"User-Agent": "attendance-manager-app", "Accept-Language": "en"}
    response = requests.get(url, params=params, headers=headers, timeout=5)
    if response.status_code != 200:
        return []
    return response.json()
