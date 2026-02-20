from sqlalchemy.orm import Session
from models import Project, Site, Worker, Attendance, Shift
from schemas.report_schema import ReportType

def build_query(db: Session, report_type: ReportType, filters):

    if report_type == ReportType.projects:
        query = db.query(Project)

    elif report_type == ReportType.sites:
        query = db.query(Site)

    elif report_type == ReportType.workers:
        query = db.query(Worker)

    elif report_type == ReportType.attendance:
        query = db.query(Attendance)

    elif report_type == ReportType.shifts:
        query = db.query(Shift)

    else:
        raise ValueError("Invalid report type")

    # 🔥 Common Filters (applied dynamically)
    if filters.project_id:
        query = query.filter_by(project_id=filters.project_id)

    if filters.site_id:
        query = query.filter_by(site_id=filters.site_id)

    if filters.worker_id:
        query = query.filter_by(worker_id=filters.worker_id)

    if filters.from_date:
        query = query.filter(Attendance.date >= filters.from_date)

    if filters.to_date:
        query = query.filter(Attendance.date <= filters.to_date)

    if filters.status:
        query = query.filter_by(status=filters.status)

    return query
