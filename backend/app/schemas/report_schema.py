from uuid import UUID
from typing import Optional, List
from enum import Enum
from datetime import date
from pydantic import BaseModel


class ReportType(str, Enum):
    projects = "projects"
    sites = "sites"
    workers = "workers"
    attendance_sitewise = "attendance_sitewise"
    attendance_workerwise = "attendance_workerwise"
    shifts = "shifts"

class ReportFormat(str, Enum):
    excel = "excel"
    pdf = "pdf"
    csv = "csv"


class ReportFilters(BaseModel):
    # Single-select (existing)
    project_id: Optional[UUID] = None
    site_id: Optional[UUID] = None
    worker_id: Optional[str] = None   # custom string worker id

    # Multi-select (used by admin dashboard)
    project_ids: Optional[List[UUID]] = None
    site_ids: Optional[List[UUID]] = None
    worker_ids: Optional[List[str]] = None

    from_date: Optional[date] = None
    to_date: Optional[date] = None
    status: Optional[str] = None


class ReportRequest(BaseModel):
    report_type: ReportType
    filters: Optional[ReportFilters] = None
    format: ReportFormat = ReportFormat.excel