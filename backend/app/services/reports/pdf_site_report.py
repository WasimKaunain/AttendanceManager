"""
pdf_site_report.py — PDF generator for Site reports.

Edit this file to customise the Site report layout independently
of the Project and Worker reports. Shared branding lives in pdf_service.py.
"""

import uuid

from app.services.reports.pdf_service import (
    build_doc,
    build_standard_elements,
    get_styles,
    # low-level helpers available if you need custom sections:
    data_table,
    meta_table,
    BRAND_ACCENT,
    BRAND_LINE,
    CONTENT_W,
)


def generate_site_pdf(report_data: dict) -> str:
    """
    Generate a branded PDF for a Site report.

    report_data keys (from SiteReportBuilder.build()):
      - title       : str
      - metadata    : dict  (Site Name, Status, Project Name, Address,
                             Latitude, Longitude, Geofence Radius,
                             Total Workforce, Created At, Generated At)
      - table       : {"headers": [...], "rows": [...]}

    Returns the path to the generated /tmp/*.pdf file.
    """
    file_path = f"/tmp/site_report_{uuid.uuid4()}.pdf"
    doc = build_doc(file_path)
    s = get_styles()

    # ── Standard title + metadata + data table ──────────────────
    elements = build_standard_elements(
        report_data, s,
        data_section_title="Site Records",
    )

    # ── Future site-specific sections can be added here ─────────
    # e.g. a geofence map snapshot, daily attendance heatmap …

    doc.build(elements)
    return file_path
