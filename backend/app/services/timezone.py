from timezonefinder import TimezoneFinder

tf = TimezoneFinder()

def get_timezone_from_coords(lat, lng):
    tz = tf.timezone_at(lat=lat, lng=lng)
    return tz if tz else "Asia/Kolkata"  # fallback