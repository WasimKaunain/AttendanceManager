from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import hash_password
from app.core.dependencies import require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/users", tags=["Users"])


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


@router.get("", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin)
):
    return db.query(User).all()


@router.post("", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    # Username uniqueness
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Admin must have an email
    if data.role.lower() == "admin" and not data.email:
        raise HTTPException(status_code=400, detail="Email is required for admin users")

    # Email uniqueness (if provided)
    if data.email:
        email_exists = db.query(User).filter(User.email == data.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use")

    new_user = User(
        employee_name=data.employee_name,
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        plain_password=data.password if data.role.lower() != "admin" else None,
        role=data.role.lower(),
        site_id=data.site_id if data.role.lower() != "admin" else None,
        status=data.status
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_action(
        db=db,
        action="create",
        entity_type="user",
        entity_id=new_user.id,
        details=f"User {new_user.username} created",
        **_audit_user(current_admin),
    )
    return new_user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, data: UserUpdate, db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # An admin can only edit another admin's profile if it is their own
    if user.role == "admin" and str(user.id) != current_admin.get("sub"):
        raise HTTPException(
            status_code=403,
            detail="You cannot edit another admin's profile"
        )

    if data.username:
        user.username = data.username

    if data.employee_name is not None:
        user.employee_name = data.employee_name

    if data.email is not None:
        # Check uniqueness (ignore own email)
        if data.email:
            clash = db.query(User).filter(User.email == data.email, User.id != user_id).first()
            if clash:
                raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email or None

    if data.role:
        user.role = data.role.lower()

    if data.site_id is not None:
        user.site_id = data.site_id

    if data.status:
        user.status = data.status

    if data.password:
        user.password_hash = hash_password(data.password)
        # Keep plain_password in sync for site_incharge
        if user.role != "admin":
            user.plain_password = data.password

    db.commit()
    db.refresh(user)
    log_action(
        db=db,
        action="update",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.username} updated",
        **_audit_user(current_admin),
    )
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin users cannot be deleted")

    db.delete(user)
    db.commit()

    log_action(
        db=db,
        action="delete",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.username} deleted",
        **_audit_user(current_admin),
    )

    return {"message": "User deleted successfully"}
