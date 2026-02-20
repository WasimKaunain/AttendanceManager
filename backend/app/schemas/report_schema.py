from uuid import UUID
from typing import Optional
from enum import Enum
from datetime import date
from pydantic import BaseModel


class ReportType(str, Enum):
    projects = "projects"
    sites = "sites"
    workers = "workers"
    attendance = "attendance"
    shifts = "shifts"


class ReportFormat(str, Enum):
    excel = "excel"
    pdf = "pdf"
    csv = "csv"


class ReportFilters(BaseModel):
    project_id: Optional[UUID] = None
    site_id: Optional[UUID] = None
    worker_id: Optional[str] = None   # if worker id is custom string
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    status: Optional[str] = None


class ReportRequest(BaseModel):
    report_type: ReportType
    filters: Optional[ReportFilters] = None
    format: ReportFormat = ReportFormat.excel