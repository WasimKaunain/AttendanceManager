from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MediaFile(BaseModel):
    key: str
    size: int
    last_modified: datetime
    download_url: str

class MediaListResponse(BaseModel):
    current_prefix: str
    folders: List[str]
    files: List[MediaFile]
    next_token: str | None = None