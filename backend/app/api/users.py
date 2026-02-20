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


@router.get("", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin)
):
    return db.query(User).all()


@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin)
):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role.lower(),
        site_id=data.site_id,
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
        details=f"User {new_user.username} created"
    )
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.username:
        user.username = data.username

    if data.role:
        user.role = data.role.lower()

    if data.site_id is not None:
        user.site_id = data.site_id

    if data.status:
        user.status = data.status

    if data.password:
        user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(user)
    log_action(
        db=db,
        action="update",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.username} updated"
    )
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.username == "env-admin":
        raise HTTPException(status_code=400, detail="Cannot delete system admin")

    db.delete(user)
    db.commit()

    log_action(
        db=db,
        action="delete",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.username} deleted"
    )

    return {"message": "User deleted successfully"}
