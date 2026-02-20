from typing import Optional, Literal
from uuid import UUID
from datetime import date
from pydantic import BaseModel, model_validator
from app.schemas.base import ORMBase


# -----------------------------
# Base Schema (Shared Fields)
# -----------------------------
class WorkerBase(BaseModel):
    full_name: str
    mobile: str
    id_number: str
    project_id: UUID
    site_id: UUID
    shift_id: Optional[UUID] = None

    role: str
    type: Literal["permanent", "contract"]

    daily_rate: Optional[float] = None
    hourly_rate: Optional[float] = None
    monthly_salary: Optional[float] = None

    status: Optional[str] = "active"

    # 🔥 Conditional Validation
    @model_validator(mode="after")
    def validate_salary_logic(self):
        if self.type == "permanent" and not self.monthly_salary:
            raise ValueError("Permanent worker must have monthly_salary")

        if self.type == "contract" and not self.hourly_rate:
            raise ValueError("Contract worker must have hourly_rate")

        return self


# -----------------------------
# Create Schema
# -----------------------------
class WorkerCreate(WorkerBase):
    pass


# -----------------------------
# Update Schema (PATCH)
# -----------------------------
class WorkerUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    id_number: Optional[str] = None
    project_id: Optional[UUID] = None
    site_id: Optional[UUID] = None
    shift_id: Optional[UUID] = None

    role: Optional[str] = None
    type: Optional[Literal["permanent", "contract"]] = None

    daily_rate: Optional[float] = None
    hourly_rate: Optional[float] = None
    monthly_salary: Optional[float] = None
    status: Optional[str] = None


# -----------------------------
# Response Schema
# -----------------------------
class WorkerResponse(ORMBase, WorkerBase):
    id: str
    joining_date: date
    photo_url: Optional[str] = None