# app/services/image_service.py

import os
from datetime import datetime
from PIL import Image

BASE_ATTENDANCE_DIR = "daily_attendance_images"


def sanitize_folder_name(name: str) -> str:
    return "".join(c for c in name if c.isalnum() or c in (" ", "_")).rstrip()


def save_compressed_attendance_image(
    temp_path: str,
    worker_name: str,
    mode: str  # "Checkin" or "Checkout"
) -> str:

    worker_folder = sanitize_folder_name(worker_name)

    folder_path = os.path.join(
        BASE_ATTENDANCE_DIR,
        worker_folder,
        mode
    )

    os.makedirs(folder_path, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
    final_path = os.path.join(folder_path, f"{timestamp}.jpg")

    # Resize + compress
    img = Image.open(temp_path)
    img = img.convert("RGB")
    img.thumbnail((640, 640))  # reduce resolution

    img.save(final_path, format="JPEG", quality=60, optimize=True)

    return final_path