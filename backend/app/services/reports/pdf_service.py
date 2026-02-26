import os
import uuid
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4


def generate_pdf(report_data):

    file_path = f"/tmp/report_{uuid.uuid4()}.pdf"
    doc = SimpleDocTemplate(file_path, pagesize=A4)

    elements = []
    styles = getSampleStyleSheet()

    # 🔹 Title
    elements.append(Paragraph(report_data["title"], styles["Title"]))
    elements.append(Spacer(1, 20))

    # 🔹 Metadata (2 Column Layout)
    metadata = report_data.get("metadata", {})

    if metadata:
        metadata_table_data = []

        for key, value in metadata.items():
            metadata_table_data.append([f"{key} :", str(value)])

        metadata_table = Table(metadata_table_data, colWidths=[150, 300])

        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))

        elements.append(metadata_table)
        elements.append(Spacer(1, 25))

    # 🔹 Table Section (If Exists)
    table_data_section = report_data.get("table")

    if table_data_section and table_data_section["headers"]:

        headers = table_data_section["headers"]
        rows = table_data_section["rows"]

        table_data = [headers] + rows

        table = Table(table_data, repeatRows=1)

        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ]))

        elements.append(table)

    doc.build(elements)

    return file_path