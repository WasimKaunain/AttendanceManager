from datetime import datetime, timedelta
from sqlalchemy.orm import Session

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
                Worker.id == str(self.filters.worker_id),
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

        # Optional site filter (frontend will pass this)
        filter_site_id = getattr(self.filters, "site_id", None)

        # Fetch attendance records in range; if a site filter is provided,
        # include records where that site handled either check-in OR check-out.
        q = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.worker_id == worker.id,
                AttendanceRecord.date >= self.filters.from_date,
                AttendanceRecord.date <= self.filters.to_date,
            )
            .order_by(AttendanceRecord.date)
        )
        if filter_site_id:
            q = q.filter(
                (AttendanceRecord.check_in_site_id == filter_site_id)
                | (AttendanceRecord.check_out_site_id == filter_site_id)
            )

        records = q.all()

        # Build a site name cache to avoid N+1 queries
        site_id_set = set()
        for r in records:
            if r.check_in_site_id:
                site_id_set.add(r.check_in_site_id)
            if r.check_out_site_id:
                site_id_set.add(r.check_out_site_id)

        site_cache = {}
        if site_id_set:
            sites = (
                self.db.query(Site)
                .filter(Site.id.in_(site_id_set))
                .all()
            )
            site_cache = {s.id: s.name for s in sites}

        # Map by date
        attendance_map = {record.date: record for record in records}

        headers = [
            "Date",
            "Status",
            "Check-in Site",
            "Check-in Time",
            "Check-out Site",
            "Check-out Time",
            "Geofence",
            "Late",
            "Total Hours",
            "Overtime Hrs",
        ]

        rows = []
        total_hours = 0.0
        total_ot = 0.0
        present_days = 0

        current_date = self.filters.from_date
        while current_date <= self.filters.to_date:
            record = attendance_map.get(current_date)

            # Treat statuses as lowercase (DB uses checked_in/checked_out)
            is_present = bool(record and record.check_in_time)

            if is_present:
                status = (record.status or "checked_in").lower()
                ci_site = site_cache.get(record.check_in_site_id, "-") if record.check_in_site_id else "-"
                co_site = site_cache.get(record.check_out_site_id, "-") if record.check_out_site_id else "-"
                ci_time = record.check_in_time.strftime("%H:%M") if record.check_in_time else "-"
                co_time = record.check_out_time.strftime("%H:%M") if record.check_out_time else "-"
                hrs = round(record.total_hours or 0, 2)
                ot = round(record.overtime_hours or 0, 2)
                geo = "✔" if record.geofence_valid else "✖"
                late = "✔" if record.is_late else ""

                # Count as present day only if there is a check-in (even if not checked out yet)
                present_days += 1

                # Sum hours only when the shift is finalized
                if status == "checked_out":
                    total_hours += hrs
                    total_ot += ot

                row = [
                    current_date.strftime("%d-%m-%Y"),
                    status,
                    ci_site,
                    ci_time,
                    co_site,
                    co_time,
                    geo,
                    late,
                    hrs if status == "checked_out" and hrs else "-",
                    ot if status == "checked_out" and ot else "-",
                ]
            else:
                row = [
                    current_date.strftime("%d-%m-%Y"),
                    "absent",
                    "-", "-", "-", "-", "-", "-", "-", "-",
                ]

            rows.append(row)
            current_date += timedelta(days=1)

        return {
            "title": "ATTENDANCE WORKERWISE REPORT",
            "metadata": {
                "Worker Name": worker.full_name,
                "Worker ID": worker.id,
                "Mobile": worker.mobile or "N/A",
                "Project": project.name if project else "N/A",
                "Assigned Site": assigned_site.name if assigned_site else "N/A",
                "Date Range": f"{self.filters.from_date}  →  {self.filters.to_date}",
                "Present Days": present_days,
                "Total Hours": round(total_hours, 2),
                "Total Overtime": round(total_ot, 2),
                "Generated At": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": headers,
                "rows": rows,
            },
        }