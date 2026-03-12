from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base


class PayrollEntry(Base):
    """
    Stores advance payments, deductions, and bonuses for a worker in a given month.
    """
    __tablename__ = "payroll_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False)

    year  = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)

    # type: "advance" | "deduction" | "bonus"
    entry_type = Column(String, nullable=False, default="advance")
    amount     = Column(Float, nullable=False)
    date       = Column(Date, nullable=False)
    note       = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=True)   # username of admin who added it
