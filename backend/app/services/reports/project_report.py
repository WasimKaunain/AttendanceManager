from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.project import Project
from app.models.site import Site
from app.models.worker import Worker

from app.services.reports.base import BaseReportBuilder


class ProjectReportBuilder(BaseReportBuilder):

    def build(self):

        if not self.filters or not self.filters.project_id:
            raise Exception("project_id is required for project report")

        project = (
            self.db.query(Project)
            .filter(
                Project.id == self.filters.project_id,
                Project.is_deleted == False
            )
            .first()
        )

        if not project:
            raise Exception("Project not found")

        # Count all sites (active + inactive, but not deleted)
        total_sites = (
            self.db.query(func.count(Site.id))
            .filter(
                Site.project_id == project.id,
                Site.is_deleted == False
            )
            .scalar()
        )

        # Count all workers (active + inactive, but not deleted)
        total_workers = (
            self.db.query(func.count(Worker.id))
            .filter(
                Worker.project_id == project.id,
                Worker.is_deleted == False
            )
            .scalar()
        )

        return {
            "title": "PROJECT REPORT",
            "metadata": {
                "Project Name": project.name,
                "Project Code": project.code or "N/A",
                "Status": project.status,
                "Client Name": project.client_name or "N/A",
                "Start Date": str(project.start_date) if project.start_date else "N/A",
                "End Date": str(project.end_date) if project.end_date else "N/A",
                "Total Sites": total_sites,
                "Total Workers": total_workers,
                "Description": project.description or "N/A",
                "Generated At": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": [],
                "rows": []
            }
        }