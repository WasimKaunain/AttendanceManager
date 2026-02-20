import os
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4

def generate_pdf(data, report_type):

    file_path = f"/tmp/{report_type}_report.pdf"
    doc = SimpleDocTemplate(file_path, pagesize=A4)

    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(f"{report_type.upper()} REPORT", styles["Title"]))
    elements.append(Spacer(1, 20))

    if not data:
        elements.append(Paragraph("No data found.", styles["Normal"]))
        doc.build(elements)
        return file_path

    # Create table header
    headers = list(data[0].keys())
    table_data = [headers]

    for row in data:
        table_data.append([str(row.get(col, "")) for col in headers])

    table = Table(table_data)

    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ]))

    elements.append(table)
    doc.build(elements)

    return file_path
