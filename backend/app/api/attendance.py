from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.attendance import AttendanceRecord
from app.schemas.attendance import AttendanceResponse
from app.core.dependencies import require_admin


router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AttendanceResponse], dependencies=[Depends(require_admin)])
def list_attendance(
    db: Session = Depends(get_db)
):
    return (
        db.query(AttendanceRecord)
        .order_by(AttendanceRecord.date.desc(), AttendanceRecord.check_in_time.desc())
        .all()
    )
