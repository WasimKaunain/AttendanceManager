from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, model_validator, Field, field_validator
from app.schemas.base import ORMBase
from datetime import datetime, date

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

    daily_working_hours: Optional[float] = None
    ot_multiplier: Optional[float] = None

    status: Optional[str] = "active"

    # -----------------------------
    # Validators
    # -----------------------------

    @field_validator("mobile", "id_number", mode="before")
    def convert_to_string(cls, v):
        if v is None:
            return v
        return str(v).strip()

    @field_validator("mobile")
    def validate_mobile(cls, v):
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Mobile number must be exactly 10 digits")
        return v

    @field_validator(
        "daily_rate",
        "hourly_rate",
        "monthly_salary",
        "daily_working_hours",
        "ot_multiplier",
        mode="before"
    )
    def empty_string_to_none(cls, v):
        if v == "":
            return None
        return v


# -----------------------------
# Create Schema
# -----------------------------
class WorkerCreate(WorkerBase):
    @model_validator(mode="after")
    def validate_salary_logic(self):
        # daily_working_hours must be present and positive for creation
        if self.daily_working_hours is None or self.daily_working_hours <= 0:
            raise ValueError("daily_working_hours must be provided and > 0")

        # If hourly_rate missing but daily_rate and daily_working_hours provided, compute it
        if (not self.hourly_rate or self.hourly_rate == 0) and self.daily_rate:
            object.__setattr__(self, 'hourly_rate', round(self.daily_rate / self.daily_working_hours, 4))

        # default ot_multiplier
        if not self.ot_multiplier:
            object.__setattr__(self, 'ot_multiplier', 1.5)

        if self.type == "permanent":
            if not self.monthly_salary:
                raise ValueError("Permanent worker must have monthly_salary")
        else:  # contract
            # contract should not require monthly salary
            if self.monthly_salary:
                # allow but clear it
                object.__setattr__(self, 'monthly_salary', None)
            if not self.daily_rate:
                raise ValueError("Contract worker must have daily_rate")

        return self


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

    # new fields
    daily_working_hours: Optional[float] = None
    ot_multiplier: Optional[float] = None

    status: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self):
        # Only validate when fields are supplied: ensure daily_working_hours if provided is > 0
        if self.daily_working_hours is not None and self.daily_working_hours <= 0:
            raise ValueError("daily_working_hours must be > 0 when provided")

        # Compute hourly_rate if possible when daily_rate and daily_working_hours provided and hourly missing
        if (self.hourly_rate is None or self.hourly_rate == 0) and self.daily_rate and self.daily_working_hours:
            object.__setattr__(self, 'hourly_rate', round(self.daily_rate / self.daily_working_hours, 4))

        # default ot_multiplier if not provided
        if self.ot_multiplier is None:
            object.__setattr__(self, 'ot_multiplier', 1.0)

        return self


# -----------------------------
# Response Schema
# -----------------------------
class WorkerResponse(ORMBase, WorkerBase):
    id: str
    joining_date: date
    photo_url: Optional[str] = None
    photo_signed_url: Optional[str] = None  # 👈 ADD THIS

    # Soft delete schema fields
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None

class ArchiveRequest(BaseModel):
    reason: str = Field(..., min_length=5)

class ForceDeleteRequest(BaseModel):
    reason: str = Field(..., min_length=5)
    confirmation: str

class ActionResponse(BaseModel):
    message: str