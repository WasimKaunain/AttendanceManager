from app.services.reports.project_report import ProjectReportBuilder
from app.services.reports.site_report import SiteReportBuilder
from app.services.reports.worker_report import WorkerReportBuilder
from app.services.reports.attendance_sitewise_report import AttendanceSitewiseReportBuilder
from app.services.reports.attendance_workerwise_report import AttendanceWorkerwiseReportBuilder

# Per-report PDF generators (edit each file independently)
from app.services.reports.pdf_project_report import generate_project_pdf
from app.services.reports.pdf_site_report import generate_site_pdf
from app.services.reports.pdf_worker_report import generate_worker_pdf
from app.services.reports.pdf_attendance_sitewise_report import generate_sitewise_pdf
from app.services.reports.pdf_attendance_workerwise_report import generate_workerwise_pdf
from app.services.reports.excel_service import generate_excel

class ReportService:

    @staticmethod
    def generate(db, report_type, filters, format="excel"):

        if report_type == "projects":
            builder = ProjectReportBuilder(db, filters)

        elif report_type == "sites":
            builder = SiteReportBuilder(db, filters)

        elif report_type == "workers":
            builder = WorkerReportBuilder(db, filters)

        elif report_type == "attendance_sitewise":
            builder = AttendanceSitewiseReportBuilder(db, filters)

        elif report_type == "attendance_workerwise":
            builder = AttendanceWorkerwiseReportBuilder(db, filters)

        else:
            raise Exception("Invalid report type")

        report_data = builder.build()

        if format == "pdf":
            if report_type == "projects":
                return generate_project_pdf(report_data)
            elif report_type == "sites":
                return generate_site_pdf(report_data)
            elif report_type == "workers":
                return generate_worker_pdf(report_data)
            elif report_type == "attendance_sitewise":
                return generate_sitewise_pdf(report_data)
            elif report_type == "attendance_workerwise":
                return generate_workerwise_pdf(report_data)
        else:
            return generate_excel(report_data)