from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import create_access_token
from app.services.user_service import authenticate_user
from app.db.session import SessionLocal

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.username, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {
        "sub": str(user.id),
        "role": user.role,
    }

    # Only add site_id if exists
    if hasattr(user, "site_id") and user.site_id:
        token_data["site_id"] = str(user.site_id)

    token = create_access_token(token_data)

    return {
        "access_token": token,
        "role": user.role,
        "site_id": token_data.get("site_id")
    }


