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

        # Fetch all attendance records for this site within the date range
        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.check_in_site_id == site.id,
                AttendanceRecord.date >= self.filters.from_date,
                AttendanceRecord.date <= self.filters.to_date
            )
            .all()
        )

        # Build attendance lookup: {(worker_id, date): record}
        attendance_map = {
            (record.worker_id, record.date): record
            for record in records
        }

        # Collect unique worker IDs that have records at this site in the range,
        # PLUS workers currently assigned to this site — union of both
        worker_ids_from_records = {r.worker_id for r in records}

        assigned_workers = (
            self.db.query(Worker)
            .filter(
                Worker.site_id == site.id,
                Worker.is_deleted == False
            )
            .all()
        )
        assigned_worker_ids = {w.id for w in assigned_workers}

        all_worker_ids = worker_ids_from_records | assigned_worker_ids

        # Fetch full Worker objects for all relevant worker IDs
        if all_worker_ids:
            workers = (
                self.db.query(Worker)
                .filter(
                    Worker.id.in_(all_worker_ids),
                    Worker.is_deleted == False
                )
                .order_by(Worker.full_name)
                .all()
            )
        else:
            workers = []

        # Generate date list
        date_list = []
        current_date = self.filters.from_date
        while current_date <= self.filters.to_date:
            date_list.append(current_date)
            current_date += timedelta(days=1)

        # Table headers: worker name + day numbers as strings
        headers = ["Worker Name"] + [str(d.day) for d in date_list]

        rows = []
        for worker in workers:
            row = [worker.full_name]
            for d in date_list:
                record = attendance_map.get((worker.id, d))
                if record and record.status == "Checked_out":
                    row.append("L" if record.is_late else "✔")
                else:
                    row.append("✖")
            rows.append(row)

        return {
            "title": "ATTENDANCE SITEWISE REPORT",
            "metadata": {
                "Site Name":     site.name,
                "Date Range":    f"{self.filters.from_date} to {self.filters.to_date}",
                "Total Workers": len(workers),
                "Total Records": len(records),
                "Generated At":  datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": headers,
                "rows":    rows,
            },
        }