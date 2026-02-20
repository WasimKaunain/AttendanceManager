from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from app.schemas.base import ORMBase


# =========================
# Base Schema
# =========================
class UserBase(BaseModel):
    username: str
    role: str
    site_id: Optional[UUID] = None
    status: Optional[str] = "active"


# =========================
# Create User (Admin only)
# =========================
class UserCreate(UserBase):
    password: str = Field(min_length=6)


# =========================
# Update User
# =========================
class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    site_id: Optional[UUID] = None
    status: Optional[str] = None
    password: Optional[str] = None


# =========================
# Response Schema
# =========================
class UserResponse(ORMBase, UserBase):
    id: UUID
