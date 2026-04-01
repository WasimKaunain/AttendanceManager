from fastapi import APIRouter, Query
from timezonefinder import TimezoneFinder
import pytz

router = APIRouter(prefix="/timezone", tags=["Timezone"])
tf = TimezoneFinder()

TIMEZONES = pytz.all_timezones


@router.get("/detect")
def get_timezone(lat: float = Query(...), lng: float = Query(...)):
    tz = tf.timezone_at(lat=lat, lng=lng)
    return {"timezone": tz or "UTC"}

@router.get("/list")
def fetch_all_timezones():
    return {
        "timezones": TIMEZONES
    }