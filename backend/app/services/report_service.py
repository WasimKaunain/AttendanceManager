from services.query_builder import build_query
from services.excel_service import generate_excel
from services.pdf_service import generate_pdf   # 👈 new

class ReportService:

    @staticmethod
    def generate(db, report_type, filters, format="excel"):

        query = build_query(db, report_type, filters)
        results = query.all()

        data = [r.__dict__ for r in results]

        for row in data:
            row.pop("_sa_instance_state", None)

        if format == "pdf":
            return generate_pdf(data, report_type)
        else:
            return generate_excel(data, report_type)
