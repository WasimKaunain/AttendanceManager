"""
pdf_attendance_sitewise_report.py — PDF generator for Attendance Sitewise reports.

The sitewise grid (Worker Name × day columns) can be very wide, so this
generator uses A4 LANDSCAPE orientation.  Edit this file independently of
the other report PDF generators.  Shared branding lives in pdf_service.py.
"""

import uuid
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

from app.services.reports.pdf_service import (
    BRAND_DARK, BRAND_BLUE, BRAND_ACCENT, BRAND_LIGHT, BRAND_LINE,
    TEXT_DARK, TEXT_MID, TEXT_LIGHT,
    LOGO_PATH, COMPANY_NAME, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_ADDRESS,
    get_styles, meta_table,
)
import os

# ── Landscape page geometry ──────────────────────────────────────
PAGE_W, PAGE_H = landscape(A4)   # ~297 × 210 mm
MARGIN   = 15 * mm
HEADER_H = 32 * mm
FOOTER_H = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN


def _draw_landscape_page(c: canvas.Canvas, doc):
    """Header + footer adapted for landscape A4."""
    c.saveState()
    w, h = landscape(A4)

    # Navy header
    c.setFillColor(BRAND_DARK)
    c.rect(0, h - HEADER_H, w, HEADER_H, fill=1, stroke=0)

    # Logo
    logo_h = HEADER_H - 8 * mm
    logo_w = logo_h * 3
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, MARGIN, h - HEADER_H + 4 * mm,
                        width=logo_w, height=logo_h,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    # Company name
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(w - MARGIN, h - HEADER_H + 18 * mm, COMPANY_NAME)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(BRAND_LINE)
    c.drawRightString(w - MARGIN, h - HEADER_H + 12 * mm, COMPANY_PHONES)
    c.drawRightString(w - MARGIN, h - HEADER_H +  7 * mm, COMPANY_EMAIL)
    c.drawRightString(w - MARGIN, h - HEADER_H +  2.5 * mm, COMPANY_ADDRESS)

    # Amber accent stripe
    c.setFillColor(BRAND_ACCENT)
    c.rect(0, h - HEADER_H - 2 * mm, w, 2 * mm, fill=1, stroke=0)

    # Navy footer
    c.setFillColor(BRAND_DARK)
    c.rect(0, 0, w, FOOTER_H - 3 * mm, fill=1, stroke=0)
    c.setFillColor(BRAND_ACCENT)
    c.rect(0, FOOTER_H - 3 * mm, w, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN,     FOOTER_H - 10 * mm, f"© {COMPANY_NAME}  —  Confidential")
    c.drawRightString(w - MARGIN, FOOTER_H - 10 * mm, f"Page {doc.page}")

    c.restoreState()


def _build_landscape_doc(file_path: str) -> BaseDocTemplate:
    doc = BaseDocTemplate(
        file_path,
        pagesize=landscape(A4),
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=HEADER_H + 6 * mm,
        bottomMargin=FOOTER_H + 3 * mm,
    )
    frame = Frame(
        MARGIN,
        FOOTER_H + 3 * mm,
        CONTENT_W,
        PAGE_H - HEADER_H - 6 * mm - FOOTER_H - 3 * mm,
        id="main",
    )
    doc.addPageTemplates([
        PageTemplate(id="main", frames=[frame], onPage=_draw_landscape_page)
    ])
    return doc


def _sitewise_grid_table(headers: list, rows: list) -> Table | None:
    """
    Renders the worker × day grid.
    First column (Worker Name) is wider; day columns are narrow.
    """
    if not headers:
        return None

    n_cols = len(headers)
    name_col_w = 42 * mm
    # Distribute remaining width evenly across day columns
    day_col_w = (CONTENT_W - name_col_w) / max(n_cols - 1, 1)
    # Clamp: min 5mm, max 10mm
    day_col_w = max(5 * mm, min(day_col_w, 10 * mm))
    col_widths = [name_col_w] + [day_col_w] * (n_cols - 1)

    th_style = ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=7,
                               textColor=colors.white, leading=9, alignment=TA_CENTER)
    name_style = ParagraphStyle("td_name", fontName="Helvetica", fontSize=7.5,
                                 textColor=TEXT_DARK, leading=10, alignment=TA_LEFT)
    tick_style = ParagraphStyle("td_tick", fontName="Helvetica", fontSize=7,
                                 textColor=TEXT_DARK, leading=9, alignment=TA_CENTER)
    tick_alt   = ParagraphStyle("td_tick_alt", fontName="Helvetica", fontSize=7,
                                 textColor=TEXT_MID, leading=9, alignment=TA_CENTER)

    table_data = [[Paragraph(str(h), th_style) for h in headers]]
    for i, row in enumerate(rows):
        cs = tick_style if i % 2 == 0 else tick_alt
        built_row = [Paragraph(str(row[0]), name_style)]   # worker name
        built_row += [Paragraph(str(c), cs) for c in row[1:]]
        table_data.append(built_row)

    tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0),  BRAND_BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BRAND_LIGHT]),
        ("LINEBELOW",      (0, 0), (-1, -1), 0.3, BRAND_LINE),
        ("BOX",            (0, 0), (-1, -1), 0.5, BRAND_BLUE),
        ("TOPPADDING",     (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 3),
        ("LEFTPADDING",    (0, 0), (-1, -1), 4),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 4),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return tbl


def generate_sitewise_pdf(report_data: dict) -> str:
    """
    Generate a branded landscape PDF for an Attendance Sitewise report.

    report_data keys (from AttendanceSitewiseReportBuilder.build()):
      - title    : str
      - metadata : dict
      - table    : {"headers": ["Worker Name", "1", "2", ...], "rows": [...]}
    """
    file_path = f"/tmp/attendance_sitewise_{uuid.uuid4()}.pdf"
    doc = _build_landscape_doc(file_path)
    s = get_styles()
    elements = []

    # Title block
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph(report_data.get("title", "SITEWISE ATTENDANCE"), s["report_title"]))
    elements.append(Paragraph(
        f"Generated on {datetime.utcnow().strftime('%B %d, %Y  %H:%M')} UTC",
        s["report_subtitle"],
    ))
    elements.append(HRFlowable(width="100%", thickness=2,
                                color=BRAND_ACCENT, spaceAfter=5 * mm))

    # Metadata
    metadata = report_data.get("metadata", {})
    if metadata:
        elements.append(Paragraph("Report Details", s["section_header"]))
        elements.append(meta_table(metadata, s))
        elements.append(Spacer(1, 6 * mm))

    # Legend
    legend_style = ParagraphStyle("legend", fontName="Helvetica", fontSize=8,
                                   textColor=TEXT_LIGHT)
    elements.append(Paragraph(
        "Legend:  ✔ = Present  |  L = Late  |  ✖ = Absent / Incomplete",
        legend_style,
    ))
    elements.append(Spacer(1, 3 * mm))

    # Attendance grid
    table_section = report_data.get("table", {})
    headers = table_section.get("headers", [])
    rows    = table_section.get("rows", [])

    if headers:
        elements.append(HRFlowable(width="100%", thickness=0.5,
                                    color=BRAND_LINE, spaceAfter=3 * mm))
        elements.append(Paragraph("Attendance Grid", s["section_header"]))
        tbl = _sitewise_grid_table(headers, rows)
        if tbl:
            elements.append(tbl)

    doc.build(elements)
    return file_path
