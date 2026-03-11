from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_name = Column(String, nullable=True)   # Human-readable name
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)  # Required for admin, nullable for site_incharge
    password_hash = Column(String, nullable=False)
    plain_password = Column(String, nullable=True)  # Stored only for site_incharge (for admin visibility)
    role = Column(String, nullable=False)
    site_id = Column(UUID(as_uuid=True))
    status = Column(String, default="active")
