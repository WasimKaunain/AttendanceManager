"""
pdf_project_report.py — PDF generator for Project reports.

Edit this file to customise the Project report layout independently
of the Site and Worker reports. Shared branding lives in pdf_service.py.
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
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, Spacer


def generate_project_pdf(report_data: dict) -> str:
    """
    Generate a branded PDF for a Project report.

    report_data keys (from ProjectReportBuilder.build()):
      - title       : str
      - metadata    : dict  (Project Name, Code, Status, Client, dates …)
      - table       : {"headers": [...], "rows": [...]}

    Returns the path to the generated /tmp/*.pdf file.
    """
    file_path = f"/tmp/project_report_{uuid.uuid4()}.pdf"
    doc = build_doc(file_path)
    s = get_styles()

    # ── Standard title + metadata + data table ──────────────────
    elements = build_standard_elements(
        report_data, s,
        data_section_title="Project Records",
    )

    # ── Future project-specific sections can be added here ──────
    # e.g. a sites breakdown table, timeline chart, KPI summary …

    doc.build(elements)
    return file_path
