from datetime import datetime, timedelta
from sqlalchemy import and_
from sqlalchemy.orm import joinedload

from app.models.worker import Worker
from app.models.project import Project
from app.models.site import Site
from app.models.attendance import AttendanceRecord

from app.services.reports.base import BaseReportBuilder


class AttendanceWorkerwiseReportBuilder(BaseReportBuilder):

    def build(self):

        if (
            not self.filters
            or not self.filters.worker_id
            or not self.filters.from_date
            or not self.filters.to_date
        ):
            raise Exception("worker_id, from_date and to_date are required")

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

        assigned_site = (
            self.db.query(Site)
            .filter(
                Site.id == worker.site_id,
                Site.is_deleted == False
            )
            .first()
        ) if worker.site_id else None

        # Fetch attendance records in range
        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.worker_id == worker.id,
                AttendanceRecord.date >= self.filters.from_date,
                AttendanceRecord.date <= self.filters.to_date
            )
            .all()
        )

        # Map attendance by date
        attendance_map = {record.date: record for record in records}

        # Prepare table headers
        headers = [
            "Date",
            "Check-in Site",
            "Check-in Time",
            "Check-out Site",
            "Check-out Time",
            "Geofence Valid",
            "Late",
            "Total Hours",
            "Overtime Hours"
        ]

        rows = []

        current_date = self.filters.from_date
        end_date = self.filters.to_date

        while current_date <= end_date:

            record = attendance_map.get(current_date)

            if record and record.status == "Checked_out":

                # Resolve check-in site
                checkin_site = (
                    self.db.query(Site)
                    .filter(Site.id == record.check_in_site_id)
                    .first()
                )

                checkout_site = (
                    self.db.query(Site)
                    .filter(Site.id == record.check_out_site_id)
                    .first()
                ) if record.check_out_site_id else None

                row = [
                    current_date.strftime("%d-%m-%Y"),
                    checkin_site.name if checkin_site else "-",
                    record.check_in_time.strftime("%H:%M") if record.check_in_time else "-",
                    checkout_site.name if checkout_site else "-",
                    record.check_out_time.strftime("%H:%M") if record.check_out_time else "-",
                    "✔" if record.geofence_valid else "✖",
                    "✔" if record.is_late else "",
                    record.total_hours if record.total_hours else 0,
                    record.overtime_hours if record.overtime_hours else 0,
                ]

            else:
                # Absent OR Incomplete
                row = [
                    current_date.strftime("%d-%m-%Y"),
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    0,
                    0,
                ]

            rows.append(row)

            current_date += timedelta(days=1)

        return {
            "title": "ATTENDANCE WORKERWISE REPORT",
            "metadata": {
                "Worker Name": worker.full_name,
                "Worker ID": worker.id,
                "Mobile": worker.mobile,
                "Project Name": project.name if project else "N/A",
                "Assigned Site": assigned_site.name if assigned_site else "N/A",
                "Date Range": f"{self.filters.from_date} to {self.filters.to_date}",
                "Generated At": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": headers,
                "rows": rows
            }
        }