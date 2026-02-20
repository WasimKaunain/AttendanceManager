from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from uuid import uuid4

from app.db.session import SessionLocal
from app.schemas.report_schema import ReportRequest
from app.services.report_service import ReportService
from app.core.dependencies import require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/generate", dependencies=[Depends(require_admin)])
def generate_report(
    request: ReportRequest,
    db: Session = Depends(get_db)
):
    try:
        file_path = ReportService.generate(
            db=db,
            report_type=request.report_type,
            filters=request.filters,
            format=request.format   # 👈 ADD THIS
        )

        if request.format == "pdf":
            media_type = "application/pdf"
            filename = f"{request.report_type}_report.pdf"
        else:
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"{request.report_type}_report.xlsx"

        return FileResponse(
            file_path,
            media_type=media_type,
            filename=filename
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
