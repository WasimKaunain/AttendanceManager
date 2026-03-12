from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.shift import Shift
from app.schemas.shift import ShiftCreate, ShiftResponse
from app.core.dependencies import require_admin
from app.services.audit_service import log_action
from uuid import UUID
from fastapi import HTTPException

router = APIRouter(prefix="/shifts", tags=["Shifts"])


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


@router.post("/", response_model=ShiftResponse)
def create_shift(data: ShiftCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    shift = Shift(**data.dict())
    db.add(shift)
    db.commit()
    db.refresh(shift)

    log_action(
        db=db,
        action="create",
        entity_type="shift",
        entity_id=str(shift.id),
        details=f"Shift {shift.name} created",
        **_audit_user(current_user),
    )

    return shift


@router.get("/", dependencies=[Depends(require_admin)])
def list_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).all()


@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: UUID,
    data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(404, "Shift not found")

    for key, value in data.dict().items():
        setattr(shift, key, value)

    db.commit()
    db.refresh(shift)

    log_action(
        db=db,
        action="update",
        entity_type="shift",
        entity_id=str(shift.id),
        details=f"Shift {shift.name} updated",
        **_audit_user(current_user),
    )
    return shift


@router.delete("/{shift_id}")
def delete_shift(
    shift_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(404, "Shift not found")

    db.delete(shift)
    db.commit()

    log_action(
        db=db,
        action="delete",
        entity_type="shift",
        entity_id=str(shift.id),
        details=f"Shift {shift.name} deleted",
        **_audit_user(current_user),
    )

    return {"message": "Shift deleted successfully"}
