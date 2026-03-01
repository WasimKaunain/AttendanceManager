# app/services/image_service.py

import os
from io import BytesIO
from datetime import datetime
from PIL import Image
from app.services.r2 import upload_file_to_r2
BASE_ATTENDANCE_DIR = "daily_attendance_images"


# def sanitize_folder_name(name: str) -> str:
#     return "".join(c for c in name if c.isalnum() or c in (" ", "_")).rstrip()


def save_compressed_attendance_image(temp_path: str,worker_name: str,mode: str) -> str: # "Checkin" or "Checkout") 

    # 1️⃣ Generate timestamp filename
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")

    object_key = (
        f"Attendance Images/"
        f"{worker_name}/"
        f"{mode}/"
        f"{timestamp}.jpg"
    )

    # 2️⃣ Open and compress image
    img = Image.open(temp_path)
    img = img.convert("RGB")
    img.thumbnail((640, 640))

    # 3️⃣ Save to memory buffer instead of disk
    buffer = BytesIO()
    img.save(buffer,format="JPEG",quality=60,optimize=True)

    buffer.seek(0)

    # 4️⃣ Upload compressed image to R2
    upload_file_to_r2(file_bytes=buffer.getvalue(),object_key=object_key,content_type="image/jpeg")

    return object_key