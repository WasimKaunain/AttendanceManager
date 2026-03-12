from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from uuid import UUID

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


def _audit_user(user: dict) -> dict:
    return {
        "performed_by": UUID(user["sub"]) if user.get("sub") else None,
        "performed_by_name": user.get("name") or user.get("sub", "Unknown"),
        "performed_by_role": user.get("role", "admin"),
    }


@router.post("/generate", dependencies=[Depends(require_admin)])
def generate_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
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

        log_action(
            db=db,
            action="report_download",
            entity_type="report",
            entity_id=request.report_type,
            details=f"Report '{request.report_type}' downloaded as {request.format.upper()}. Filters: {request.filters}",
            **_audit_user(current_user),
        )

        return FileResponse(
            file_path,
            media_type=media_type,
            filename=filename
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
