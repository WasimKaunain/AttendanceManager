"""
pdf_service.py — Shared branding, constants, and helper utilities.

Each report type has its own dedicated PDF generator:
  - pdf_project_report.py  →  generate_project_pdf(report_data)
  - pdf_site_report.py     →  generate_site_pdf(report_data)
  - pdf_worker_report.py   →  generate_worker_pdf(report_data)

This module is imported by those generators; it also exposes
generate_pdf() as a generic fallback for attendance / unknown types.
"""

import os
import uuid
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

# ── Brand colours ────────────────────────────────────────────────
BRAND_DARK   = colors.HexColor("#0B1F3A")
BRAND_BLUE   = colors.HexColor("#1A56A0")
BRAND_ACCENT = colors.HexColor("#E8911F")
BRAND_LIGHT  = colors.HexColor("#EEF4FB")
BRAND_LINE   = colors.HexColor("#C8D8EF")
TEXT_DARK    = colors.HexColor("#1C1C1C")
TEXT_MID     = colors.HexColor("#4A4A4A")
TEXT_LIGHT   = colors.HexColor("#787878")

# ── Company details ──────────────────────────────────────────────
LOGO_PATH = os.path.normpath(os.path.join(
    os.path.dirname(__file__),
    "../../../../Assets/AINTSOL_LOGO.png",
))
COMPANY_NAME    = "Advanced Integrated Solutions"
COMPANY_PHONES  = "+966-580840913  |  +966-533198610"
COMPANY_EMAIL   = "info@aintsol.com"
COMPANY_ADDRESS = "P.O.Box 8952, Riyadh 11492, Saudi Arabia"

# ── Page geometry ────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN         = 18 * mm
CONTENT_W      = PAGE_W - 2 * MARGIN
HEADER_H       = 38 * mm
FOOTER_H       = 22 * mm


# ════════════════════════════════════════════════════════════════
#  draw_page — canvas-level header + footer (called by PageTemplate)
# ════════════════════════════════════════════════════════════════
def draw_page(c: canvas.Canvas, doc):
    c.saveState()
    w, h = A4

    # Navy header bar
    c.setFillColor(BRAND_DARK)
    c.rect(0, h - HEADER_H, w, HEADER_H, fill=1, stroke=0)

    # Logo
    logo_y = h - HEADER_H + 5 * mm
    logo_h = HEADER_H - 10 * mm
    logo_w = logo_h * 3
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, MARGIN, logo_y,
                        width=logo_w, height=logo_h,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    # Company name + contact (right side)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(w - MARGIN, h - HEADER_H + 21 * mm, COMPANY_NAME)
    c.setFont("Helvetica", 8)
    c.setFillColor(BRAND_LINE)
    c.drawRightString(w - MARGIN, h - HEADER_H + 14 * mm, COMPANY_PHONES)
    c.drawRightString(w - MARGIN, h - HEADER_H +  9 * mm, COMPANY_EMAIL)
    c.drawRightString(w - MARGIN, h - HEADER_H +  4 * mm, COMPANY_ADDRESS)

    # Amber accent stripe under header
    c.setFillColor(BRAND_ACCENT)
    c.rect(0, h - HEADER_H - 2.5 * mm, w, 2.5 * mm, fill=1, stroke=0)

    # Navy footer bar
    c.setFillColor(BRAND_DARK)
    c.rect(0, 0, w, FOOTER_H - 4 * mm, fill=1, stroke=0)
    c.setFillColor(BRAND_ACCENT)
    c.rect(0, FOOTER_H - 4 * mm, w, 2 * mm, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN,     FOOTER_H - 12 * mm, f"© {COMPANY_NAME}  —  Confidential")
    c.drawRightString(w - MARGIN, FOOTER_H - 12 * mm, f"Page {doc.page}")

    c.restoreState()


# ════════════════════════════════════════════════════════════════
#  get_styles — shared ParagraphStyle dictionary
# ════════════════════════════════════════════════════════════════
def get_styles() -> dict:
    return {
        "report_title": ParagraphStyle(
            "report_title",
            fontName="Helvetica-Bold", fontSize=20,
            textColor=BRAND_DARK, spaceAfter=2 * mm, leading=24,
        ),
        "report_subtitle": ParagraphStyle(
            "report_subtitle",
            fontName="Helvetica", fontSize=10,
            textColor=TEXT_LIGHT, spaceAfter=6 * mm,
        ),
        "section_header": ParagraphStyle(
            "section_header",
            fontName="Helvetica-Bold", fontSize=10,
            textColor=BRAND_BLUE,
            spaceBefore=4 * mm, spaceAfter=2 * mm,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica", fontSize=9,
            textColor=TEXT_DARK, leading=13,
        ),
        "kv_key": ParagraphStyle(
            "kv_key",
            fontName="Helvetica-Bold", fontSize=8.5,
            textColor=TEXT_LIGHT, leading=12,
        ),
        "kv_val": ParagraphStyle(
            "kv_val",
            fontName="Helvetica", fontSize=9,
            textColor=TEXT_DARK, leading=12,
        ),
        "table_header": ParagraphStyle(
            "table_header",
            fontName="Helvetica-Bold", fontSize=8.5,
            textColor=colors.white, leading=11, alignment=TA_CENTER,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            fontName="Helvetica", fontSize=8,
            textColor=TEXT_DARK, leading=11, alignment=TA_CENTER,
        ),
        "table_cell_alt": ParagraphStyle(
            "table_cell_alt",
            fontName="Helvetica", fontSize=8,
            textColor=TEXT_MID, leading=11, alignment=TA_CENTER,
        ),
    }


# ════════════════════════════════════════════════════════════════
#  build_doc — configured BaseDocTemplate ready for content
# ════════════════════════════════════════════════════════════════
def build_doc(file_path: str) -> BaseDocTemplate:
    doc = BaseDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=HEADER_H + 8 * mm,
        bottomMargin=FOOTER_H + 4 * mm,
    )
    frame = Frame(
        MARGIN,
        FOOTER_H + 4 * mm,
        CONTENT_W,
        PAGE_H - HEADER_H - 8 * mm - FOOTER_H - 4 * mm,
        id="main",
    )
    doc.addPageTemplates([
        PageTemplate(id="main", frames=[frame], onPage=draw_page)
    ])
    return doc


# ════════════════════════════════════════════════════════════════
#  meta_table — 2-column key-value metadata table
# ════════════════════════════════════════════════════════════════
def meta_table(metadata: dict, styles: dict) -> Table:
    data = []
    items = list(metadata.items())
    for i in range(0, len(items), 2):
        row = []
        for k, v in items[i:i+2]:
            row.extend([
                Paragraph(str(k), styles["kv_key"]),
                Paragraph(str(v), styles["kv_val"]),
            ])
        while len(row) < 4:
            row.extend([Paragraph("", styles["kv_val"]),
                        Paragraph("", styles["kv_val"])])
        data.append(row)

    col_w = CONTENT_W / 4
    tbl = Table(data, colWidths=[col_w * 0.55, col_w * 0.95,
                                  col_w * 0.55, col_w * 0.95])
    tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BRAND_LIGHT, colors.white]),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
        ("BOX",            (0, 0), (-1, -1), 0.5, BRAND_LINE),
        ("LINEBELOW",      (0, 0), (-1, -2), 0.3, BRAND_LINE),
    ]))
    return tbl


# ════════════════════════════════════════════════════════════════
#  data_table — branded table with navy header row
# ════════════════════════════════════════════════════════════════
def data_table(headers: list, rows: list, styles: dict,
               col_widths=None) -> Table | None:
    if not headers:
        return None

    table_data = [[Paragraph(str(h), styles["table_header"]) for h in headers]]
    for i, row in enumerate(rows):
        cs = styles["table_cell"] if i % 2 == 0 else styles["table_cell_alt"]
        table_data.append([Paragraph(str(c), cs) for c in row])

    if col_widths is None:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0),  BRAND_BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BRAND_LIGHT]),
        ("LINEBELOW",      (0, 0), (-1, -1), 0.3, BRAND_LINE),
        ("BOX",            (0, 0), (-1, -1), 0.5, BRAND_BLUE),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 6),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return tbl


# ════════════════════════════════════════════════════════════════
#  _build_standard_elements — shared title + metadata + table flow
# ════════════════════════════════════════════════════════════════
def build_standard_elements(report_data: dict, s: dict,
                             data_section_title: str = "Data Summary") -> list:
    elements = []

    title = report_data.get("title", "REPORT")
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph(title, s["report_title"]))
    elements.append(Paragraph(
        f"Generated on {datetime.utcnow().strftime('%B %d, %Y  %H:%M')} UTC",
        s["report_subtitle"],
    ))
    elements.append(HRFlowable(width="100%", thickness=2,
                                color=BRAND_ACCENT, spaceAfter=5 * mm))

    metadata = report_data.get("metadata", {})
    if metadata:
        elements.append(Paragraph("Report Details", s["section_header"]))
        elements.append(meta_table(metadata, s))
        elements.append(Spacer(1, 6 * mm))

    table_section = report_data.get("table")
    if table_section and table_section.get("headers"):
        elements.append(HRFlowable(width="100%", thickness=0.5,
                                    color=BRAND_LINE, spaceAfter=3 * mm))
        elements.append(Paragraph(data_section_title, s["section_header"]))
        tbl = data_table(table_section["headers"],
                         table_section.get("rows", []), s)
        if tbl:
            elements.append(tbl)

    return elements


# ════════════════════════════════════════════════════════════════
#  generate_pdf — generic fallback (attendance + unknown types)
# ════════════════════════════════════════════════════════════════
def generate_pdf(report_data: dict) -> str:
    """
    Generic PDF generator used as fallback for attendance reports.
    Project / Site / Worker reports use their dedicated generators.
    """
    file_path = f"/tmp/report_{uuid.uuid4()}.pdf"
    doc = build_doc(file_path)
    s = get_styles()
    elements = build_standard_elements(report_data, s)
    doc.build(elements)
    return file_path
