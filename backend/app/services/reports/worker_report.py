from sqlalchemy import func
from datetime import datetime

from app.models.worker import Worker
from app.models.project import Project
from app.models.site import Site
from app.models.attendance import AttendanceRecord

from app.services.reports.base import BaseReportBuilder


class WorkerReportBuilder(BaseReportBuilder):

    def build(self):

        if not self.filters or not self.filters.worker_id:
            raise Exception("worker_id is required for worker report")

        worker = (
            self.db.query(Worker)
            .filter(
                Worker.id == self.filters.worker_id,
                Worker.is_deleted == False
            )
            .first()
        )

        if not worker:
            raise Exception("Worker not found")

        project = (
            self.db.query(Project)
            .filter(
                Project.id == worker.project_id,
                Project.is_deleted == False
            )
            .first()
        ) if worker.project_id else None

        site = (
            self.db.query(Site)
            .filter(
                Site.id == worker.site_id,
                Site.is_deleted == False
            )
            .first()
        ) if worker.site_id else None

        # Attendance Lifetime Summary
        total_records = (
            self.db.query(func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.worker_id == worker.id)
            .scalar()
        )

        total_hours = (
            self.db.query(func.coalesce(func.sum(AttendanceRecord.total_hours), 0))
            .filter(AttendanceRecord.worker_id == worker.id)
            .scalar()
        )

        total_overtime = (
            self.db.query(func.coalesce(func.sum(AttendanceRecord.overtime_hours), 0))
            .filter(AttendanceRecord.worker_id == worker.id)
            .scalar()
        )

        return {
            "title": "WORKER REPORT",
            "metadata": {
                "Worker Name": worker.full_name,
                "Worker ID": worker.id,
                "Status": worker.status,
                "Joining Date": str(worker.joining_date) if worker.joining_date else "N/A",
                "Mobile": worker.mobile,
                "ID Number": worker.id_number,
                "Project Name": project.name if project else "N/A",
                "Site Name": site.name if site else "N/A",
                "Role": worker.role,
                "Type": worker.type,
                "Daily Rate": worker.daily_rate if worker.daily_rate else "N/A",
                "Hourly Rate": worker.hourly_rate if worker.hourly_rate else "N/A",
                "Monthly Salary": worker.monthly_salary if worker.monthly_salary else "N/A",
                "Total Attendance Records": total_records,
                "Total Hours Worked": float(total_hours),
                "Total Overtime Hours": float(total_overtime),
                "Generated At": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": [],
                "rows": []
            }
        }