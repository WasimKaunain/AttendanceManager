from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import Field
from app.schemas.base import ORMBase


# ---------------- BASE ----------------

class ProjectBase(ORMBase):
    name: str
    code: str
    description: Optional[str] = None
    client_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(
        default="active",
        pattern="^(upcoming|active|completed|inactive|terminated)$"
    )


# ---------------- CREATE ----------------

class ProjectCreate(ProjectBase):
    pass


# ---------------- UPDATE ----------------

class ProjectUpdate(ORMBase):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(
        default=None,
        pattern="^(upcoming|active|completed|inactive|terminated)$"
    )


# ---------------- RESPONSE ----------------

class ProjectResponse(ProjectBase):
    id: UUID
    is_deleted : bool
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None