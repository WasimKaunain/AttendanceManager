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
            .filter(Site.id == self.filters.site_id, Site.is_deleted == False)
            .first()
        )

        if not site:
            raise Exception("Site not found")

        # ---- FETCH RECORDS ----
        records = (
            self.db.query(AttendanceRecord)
            .filter(
                (
                    (AttendanceRecord.check_in_site_id == site.id)
                    | (AttendanceRecord.check_out_site_id == site.id)
                ),
                AttendanceRecord.date >= self.filters.from_date,
                AttendanceRecord.date <= self.filters.to_date,
            )
            .all()
        )

        attendance_map = {
            (record.worker_id, record.date): record
            for record in records
        }

        # ---- WORKERS ----
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

        # ---- DATE LIST ----
        date_list = []
        current_date = self.filters.from_date
        while current_date <= self.filters.to_date:
            date_list.append(current_date)
            current_date += timedelta(days=1)

        # ---- HEADERS ----
        headers = (
            ["Worker Name"]
            + [d.strftime("%d/%m") for d in date_list]
            + ["Total Hours", "Rate/hr", "Gross Amount"]
        )

        # ---- RATE FUNCTION ----
        def get_hourly_rate(worker):
            if worker.hourly_rate:
                return worker.hourly_rate
            if worker.daily_rate:
                return worker.daily_rate / (worker.daily_working_hours or 9)
            if worker.monthly_salary:
                return (worker.monthly_salary / 30) / (worker.daily_working_hours or 9)
            return 0

        # ---- ROWS ----
        rows = []

        for worker in workers:
            row = [worker.full_name]
            total_hours = 0

            for d in date_list:
                record = attendance_map.get((worker.id, d))

                if record and (record.status or "").lower() == "checked_out":
                    hours = record.total_hours or 0
                    total_hours += hours
                    row.append("L" if record.is_late else "✔")
                else:
                    row.append("✖")

            total_hours = round(total_hours, 2)

            rate = round(get_hourly_rate(worker), 2)
            gross = round(total_hours * rate, 2)

            row.append(total_hours)
            row.append(rate)
            row.append(gross)

            rows.append(row)

        # ---- COLUMN COUNT ----
        total_columns = 1 + len(date_list) + 3

        # ---- METADATA STRING (READY FOR MERGED CELL) ----
        metadata_text = (
            f"Site Name    : {site.name}\n"
            f"Date Range   : {self.filters.from_date.strftime('%d/%m/%Y')} to {self.filters.to_date.strftime('%d/%m/%Y')}\n"
            f"Total Workers: {len(workers)}\n"
            f"Generated At : {datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S')}"
        )

        # ---- WIDTH CONFIG (FOR EXCEL LAYER) ----
        column_config = {
            "worker_col_width": 25,
            "date_col_width": 12,
            "summary_col_width": 15,
            "max_auto_width": 40
        }

        return {
            "title": "ATTENDANCE SITEWISE REPORT",
            "metadata": {
                "text": metadata_text,
                "total_columns": total_columns,
            },
            "table": {
                "headers": headers,
                "rows": rows,
            },
            "column_config": column_config
        }