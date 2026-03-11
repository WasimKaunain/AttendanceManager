"""
pdf_attendance_workerwise_report.py — PDF generator for Attendance Workerwise reports.

Edit this file independently of the other report PDF generators.
Shared branding lives in pdf_service.py.
"""

import uuid
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, Paragraph, Spacer, Table, TableStyle,
)

from app.services.reports.pdf_service import (
    BRAND_DARK, BRAND_BLUE, BRAND_ACCENT, BRAND_LIGHT, BRAND_LINE,
    TEXT_DARK, TEXT_MID, TEXT_LIGHT,
    CONTENT_W,
    build_doc, get_styles, meta_table,
)


def _workerwise_table(headers: list, rows: list) -> Table | None:
    """
    Attendance detail table for a single worker.
    Date column is wider; other columns are even.
    """
    if not headers:
        return None

    n_cols = len(headers)
    date_w   = 24 * mm
    status_w = 22 * mm
    site_w   = 32 * mm
    time_w   = 18 * mm
    bool_w   = 16 * mm
    num_w    = 20 * mm

    # Map columns by position: Date, Status, CI Site, CI Time, CO Site, CO Time, Geo, Late, Hrs, OT
    col_widths = [date_w, status_w, site_w, time_w, site_w, time_w, bool_w, bool_w, num_w, num_w]
    # If unexpected number of columns, fall back to even distribution
    if len(col_widths) != n_cols:
        col_widths = [CONTENT_W / n_cols] * n_cols

    th_style   = ParagraphStyle("th",    fontName="Helvetica-Bold", fontSize=7.5,
                                  textColor=colors.white, leading=10, alignment=TA_CENTER)
    date_style = ParagraphStyle("date",  fontName="Helvetica-Bold", fontSize=8,
                                  textColor=TEXT_DARK,   leading=11, alignment=TA_CENTER)
    cell_style = ParagraphStyle("td",    fontName="Helvetica",      fontSize=8,
                                  textColor=TEXT_DARK,   leading=11, alignment=TA_CENTER)
    alt_style  = ParagraphStyle("td_a",  fontName="Helvetica",      fontSize=8,
                                  textColor=TEXT_MID,    leading=11, alignment=TA_CENTER)
    absent_style = ParagraphStyle("abs", fontName="Helvetica-Oblique", fontSize=8,
                                   textColor=colors.HexColor("#B0B0B0"), leading=11, alignment=TA_CENTER)

    table_data = [[Paragraph(str(h), th_style) for h in headers]]

    for i, row in enumerate(rows):
        cs = cell_style if i % 2 == 0 else alt_style
        is_absent = (len(row) > 1 and str(row[1]) == "Absent")
        built_row = []
        for j, cell in enumerate(row):
            if is_absent:
                built_row.append(Paragraph(str(cell), absent_style))
            elif j == 0:
                built_row.append(Paragraph(str(cell), date_style))
            else:
                built_row.append(Paragraph(str(cell), cs))
        table_data.append(built_row)

    tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0),  BRAND_BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BRAND_LIGHT]),
        ("LINEBELOW",      (0, 0), (-1, -1), 0.3, BRAND_LINE),
        ("BOX",            (0, 0), (-1, -1), 0.5, BRAND_BLUE),
        ("TOPPADDING",     (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 4),
        ("LEFTPADDING",    (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 5),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return tbl


def generate_workerwise_pdf(report_data: dict) -> str:
    """
    Generate a branded PDF for an Attendance Workerwise report.

    report_data keys (from AttendanceWorkerwiseReportBuilder.build()):
      - title    : str
      - metadata : dict  (Worker Name, ID, Mobile, Project, Site, Date Range …)
      - table    : {"headers": [...], "rows": [...]}
    """
    file_path = f"/tmp/attendance_workerwise_{uuid.uuid4()}.pdf"
    doc = build_doc(file_path)
    s = get_styles()
    elements = []

    # Title block
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph(report_data.get("title", "WORKERWISE ATTENDANCE"), s["report_title"]))
    elements.append(Paragraph(
        f"Generated on {datetime.utcnow().strftime('%B %d, %Y  %H:%M')} UTC",
        s["report_subtitle"],
    ))
    elements.append(HRFlowable(width="100%", thickness=2,
                                color=BRAND_ACCENT, spaceAfter=5 * mm))

    # Metadata
    metadata = report_data.get("metadata", {})
    if metadata:
        elements.append(Paragraph("Worker Details", s["section_header"]))
        elements.append(meta_table(metadata, s))
        elements.append(Spacer(1, 6 * mm))

    # Attendance detail table
    table_section = report_data.get("table", {})
    headers = table_section.get("headers", [])
    rows    = table_section.get("rows", [])

    if headers:
        elements.append(HRFlowable(width="100%", thickness=0.5,
                                    color=BRAND_LINE, spaceAfter=3 * mm))
        elements.append(Paragraph("Attendance Log", s["section_header"]))
        tbl = _workerwise_table(headers, rows)
        if tbl:
            elements.append(tbl)

    doc.build(elements)
    return file_path
