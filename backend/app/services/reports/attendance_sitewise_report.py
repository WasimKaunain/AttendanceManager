from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.site import Site
from app.models.worker import Worker
from app.models.attendance import AttendanceRecord

from app.services.reports.base import BaseReportBuilder


class AttendanceSitewiseReportBuilder(BaseReportBuilder):

    def build(self):

        if (
            not self.filters
            or not self.filters.site_id
            or not self.filters.from_date
            or not self.filters.to_date
        ):
            raise Exception("site_id, from_date and to_date are required")

        site = (
            self.db.query(Site)
            .filter(
                Site.id == self.filters.site_id,
                Site.is_deleted == False
            )
            .first()
        )

        if not site:
            raise Exception("Site not found")

        # Get all workers assigned to this site (include active + inactive)
        workers = (
            self.db.query(Worker)
            .filter(
                Worker.site_id == site.id,
                Worker.is_deleted == False
            )
            .all()
        )

        # Fetch attendance records for this site within range
        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.check_in_site_id == site.id,
                AttendanceRecord.date >= self.filters.from_date,
                AttendanceRecord.date <= self.filters.to_date
            )
            .all()
        )

        # Build attendance lookup:
        # {(worker_id, date): record}
        attendance_map = {
            (record.worker_id, record.date): record
            for record in records
        }

        # Generate date list
        current_date = self.filters.from_date
        end_date = self.filters.to_date

        date_list = []
        while current_date <= end_date:
            date_list.append(current_date)
            current_date += timedelta(days=1)

        # Table headers
        headers = ["Worker Name"] + [d.day for d in date_list]

        rows = []

        for worker in workers:

            row = [worker.full_name]

            for date in date_list:

                record = attendance_map.get((worker.id, date))

                if record and record.status == "Checked_out":
                    if record.is_late:
                        row.append("L")
                    else:
                        row.append("✔")
                else:
                    # No record OR incomplete
                    row.append("✖")

            rows.append(row)

        return {
            "title": "ATTENDANCE SITEWISE REPORT",
            "metadata": {
                "Site Name": site.name,
                "Date Range": f"{self.filters.from_date} to {self.filters.to_date}",
                "Total Workers": len(workers),
                "Generated At": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": headers,
                "rows": rows
            }
        }