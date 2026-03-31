from datetime import datetime
from PIL import Image
from io import BytesIO
from app.services.r2 import upload_file_to_r2
import re, pytz

def save_compressed_attendance_image(temp_path: str,site_name: str,worker_id: str,mode: str, timezone_str : str) -> str: # "Checkin" or "Checkout"

    # 1️⃣ Validate timezone (no hardcoding, just safe fallback to UTC)
    try:
        tz = pytz.timezone(timezone_str)
    except Exception:
        tz = pytz.utc   # ✅ fallback without hardcoding region

    # 2️⃣ Get local time
    utc_now = datetime.utcnow().replace(tzinfo=pytz.utc)
    local_time = utc_now.astimezone(tz)

    # 3️⃣ Timestamp using LOCAL TIME
    timestamp = local_time.strftime("%Y-%m-%d_%H-%M-%S_%f")

    # 2️⃣ Create new structured key
    object_key = (f"{site_name}/"f"{worker_id}/"f"Attendance Images/"f"{mode}/"f"{timestamp}.jpg")

    # 3️⃣ Open and compress image
    img = Image.open(temp_path)
    img = img.convert("RGB")
    img.thumbnail((640, 640))

    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=60, optimize=True)
    buffer.seek(0)

    # 4️⃣ Upload to R2
    upload_file_to_r2(
        file_bytes=buffer.getvalue(),
        object_key=object_key,
        content_type="image/jpeg"
    )

    return object_key

def format_site_folder(site_name: str) -> str:
    # Remove leading/trailing spaces
    name = site_name.strip()

    # Replace spaces with underscore
    name = name.replace(" ", "_")

    # Remove special characters except underscore and dash
    name = re.sub(r"[^a-zA-Z0-9_-]", "", name)

    return name