from datetime import datetime
from PIL import Image
from io import BytesIO
from app.services.r2 import upload_file_to_r2
import pytz
from pathlib import Path
import re

from app.services.image_service import format_site_folder


def _sanitize_key_segment(value: str, *, default: str) -> str:
    """Keep R2 key path segments safe and predictable."""
    if not value:
        return default
    value = str(value).strip()
    value = re.sub(r"\s+", "_", value)
    value = re.sub(r"[^a-zA-Z0-9._-]", "", value)
    return value or default


def save_compressed_failed_face_image(
    temp_path: str,
    site_name: str,
    worker_id: str,
    event_type: str,
    timezone_str: str,
) -> str:
    """Compress and upload a failed face attempt selfie to R2.

    Stored separately from attendance images so Media Repository can list failures.

    R2 key structure:
      {site}/{worker}/Face Failures/{event_type}/{timestamp}.jpg
    """

    # Normalize site folder naming to match other uploads
    safe_site = format_site_folder(site_name)

    safe_worker_id = _sanitize_key_segment(worker_id, default="unknown_worker")
    safe_event_type = _sanitize_key_segment(event_type, default="unknown_event")

    try:
        tz = pytz.timezone(timezone_str)
    except Exception:
        tz = pytz.utc

    utc_now = datetime.utcnow().replace(tzinfo=pytz.utc)
    local_time = utc_now.astimezone(tz)
    timestamp = local_time.strftime("%Y-%m-%d_%H-%M-%S_%f")

    object_key = (
        f"{safe_site}/"
        f"{safe_worker_id}/"
        f"Face Failures/"
        f"{safe_event_type}/"
        f"{timestamp}.jpg"
    )

    temp_path = str(Path(temp_path))

    with Image.open(temp_path) as img:
        img = img.convert("RGB")
        img.thumbnail((640, 640))

        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=60, optimize=True)
        buffer.seek(0)

    upload_file_to_r2(
        file_bytes=buffer.getvalue(),
        object_key=object_key,
        content_type="image/jpeg",
    )

    return object_key
