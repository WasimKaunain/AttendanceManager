
from sqlalchemy import Column, String, Date, Enum
from app.db.base import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID
from datetime import date

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(String)
    client_name = Column(String)
    status = Column(String, default="active")  # inactive, completed, terminated
    start_date = Column(Date, default=date.today)
    end_date = Column(Date)
