"""
pdf_worker_report.py — PDF generator for Worker reports.

Edit this file to customise the Worker report layout independently
of the Project and Site reports. Shared branding lives in pdf_service.py.
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


def generate_worker_pdf(report_data: dict) -> str:
    """
    Generate a branded PDF for a Worker report.

    report_data keys (from WorkerReportBuilder.build()):
      - title       : str
      - metadata    : dict  (Worker Name, ID, Status, Joining Date, Mobile,
                             ID Number, Project Name, Site Name, Role, Type,
                             Daily/Hourly Rate, Monthly Salary,
                             Total Attendance Records, Total Hours Worked,
                             Total Overtime Hours, Generated At)
      - table       : {"headers": [...], "rows": [...]}

    Returns the path to the generated /tmp/*.pdf file.
    """
    file_path = f"/tmp/worker_report_{uuid.uuid4()}.pdf"
    doc = build_doc(file_path)
    s = get_styles()

    # ── Standard title + metadata + data table ──────────────────
    elements = build_standard_elements(
        report_data, s,
        data_section_title="Attendance Records",
    )

    # ── Future worker-specific sections can be added here ────────
    # e.g. a monthly attendance chart, overtime summary bar graph …

    doc.build(elements)
    return file_path
