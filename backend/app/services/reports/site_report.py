from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.site import Site
from app.models.project import Project
from app.models.worker import Worker

from app.services.reports.base import BaseReportBuilder


class SiteReportBuilder(BaseReportBuilder):

    def build(self):

        if not self.filters or not self.filters.site_id:
            raise Exception("site_id is required for site report")

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

        project = (
            self.db.query(Project)
            .filter(
                Project.id == site.project_id,
                Project.is_deleted == False
            )
            .first()
        )

        # Workforce count (include active + inactive, exclude deleted)
        workforce_count = (
            self.db.query(func.count(Worker.id))
            .filter(
                Worker.site_id == site.id,
                Worker.is_deleted == False
            )
            .scalar()
        )

        return {
            "title": "SITE REPORT",
            "metadata": {
                "Site Name": site.name,
                "Status": site.status,
                "Project Name": project.name if project else "N/A",
                "Address": site.address or "N/A",
                "Latitude": site.latitude,
                "Longitude": site.longitude,
                "Geofence Radius (m)": site.geofence_radius,
                "Total Workforce": workforce_count,
                "Created At": str(site.created_at) if site.created_at else "N/A",
                "Generated At": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            },
            "table": {
                "headers": [],
                "rows": []
            }
        }