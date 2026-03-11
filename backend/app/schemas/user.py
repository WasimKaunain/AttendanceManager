from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from uuid import UUID
from app.schemas.base import ORMBase


# =========================
# Base Schema
# =========================
class UserBase(BaseModel):
    employee_name: Optional[str] = None
    username: str
    email: Optional[EmailStr] = None   # Required for admin; nullable for site_incharge
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
    employee_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    site_id: Optional[UUID] = None
    status: Optional[str] = None
    password: Optional[str] = None


# =========================
# Response Schema
# =========================
class UserResponse(ORMBase, UserBase):
    id: UUID
    plain_password: Optional[str] = None  # Only present for site_incharge
