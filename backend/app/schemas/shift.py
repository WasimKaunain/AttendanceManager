from uuid import UUID
from typing import Optional
from datetime import time
from pydantic import BaseModel, Field, model_validator
from app.schemas.base import ORMBase


class ShiftBase(BaseModel):
    name: str
    start_time: time
    end_time: time
    grace_period_minutes: int = Field(default=15, ge=0)
    overtime_threshold_hours: float = Field(default=8.0, ge=0)
    project_id: UUID

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")
        return self


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(BaseModel):
    name: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    grace_period_minutes: Optional[int] = Field(default=None, ge=0)
    overtime_threshold_hours: Optional[float] = Field(default=None, ge=0)
    project_id: Optional[UUID] = None


class ShiftResponse(ORMBase, ShiftBase):
    id: UUID