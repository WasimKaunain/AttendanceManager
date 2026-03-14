from sqlalchemy.orm import Session

from app.models.site import Site
from app.models.worker import Worker
from app.services.image_service import format_site_folder
from app.services.r2 import object_exists_in_r2

PROFILE_PHOTO_FILE_NAME = "profile.jpg"


def _site_folder_candidates(site_name: str) -> list[str]:
    raw_site_name = (site_name or "").strip()
    formatted_site_name = format_site_folder(raw_site_name) if raw_site_name else ""

    candidates: list[str] = []
    for candidate in (formatted_site_name, raw_site_name):
        if candidate and candidate not in candidates:
            candidates.append(candidate)
    return candidates


def build_worker_profile_photo_keys(site_name: str, worker_id: str) -> list[str]:
    return [
        f"{site_folder}/{worker_id}/Assets/{PROFILE_PHOTO_FILE_NAME}"
        for site_folder in _site_folder_candidates(site_name)
    ]


def resolve_worker_profile_photo_key(worker: Worker, db: Session) -> str | None:
    stored_key = getattr(worker, "photo_url", None)
    if stored_key and object_exists_in_r2(stored_key):
        return stored_key

    if not getattr(worker, "site_id", None):
        return None

    site = db.query(Site).filter(Site.id == worker.site_id).first()
    if not site:
        return None

    for candidate_key in build_worker_profile_photo_keys(site.name, worker.id):
        if object_exists_in_r2(candidate_key):
            return candidate_key

    return None

