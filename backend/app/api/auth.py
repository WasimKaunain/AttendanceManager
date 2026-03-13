from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest
from app.core.security import create_access_token, hash_password
from app.services.user_service import authenticate_user
from app.services.email_service import send_otp_email
from app.services import otp_store
from app.models.user import User
from app.models.site import Site
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

    if data.login_as and user.role != data.login_as:
        raise HTTPException(
            status_code=403,
            detail=f"This account is not allowed for '{data.login_as}' login"
        )

    token_data = {
        "sub": str(user.id),
        "role": user.role,
    }

    # Include display name if available
    if hasattr(user, "employee_name") and user.employee_name:
        token_data["name"] = user.employee_name
    else:
        token_data["name"] = getattr(user, "username", str(user.id))

    site_name = None

    # Only add site context if exists (site_incharge)
    if hasattr(user, "site_id") and user.site_id:
        token_data["site_id"] = str(user.site_id)
        site = db.query(Site).filter(Site.id == user.site_id).first()
        if site:
            site_name = site.name
            token_data["site_name"] = site_name

    token = create_access_token(token_data)

    return {
        "access_token": token,
        "role": user.role,
        "site_id": token_data.get("site_id"),
        "site_name": site_name,
        "selected_site_id": token_data.get("selected_site_id"),
        "selected_site_name": token_data.get("selected_site_name"),
    }


# ── Forgot Password ────────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 1 — verify the email belongs to an active admin, then send OTP.
    Returns 404 if no matching admin record is found.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")

    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Password reset via email is only available for admin accounts.")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="This account is inactive. Contact your administrator.")

    # Valid admin — generate and send OTP
    otp = otp_store.generate_otp()
    otp_store.save_otp(str(data.email), otp)
    try:
        send_otp_email(
            to_email=str(data.email),
            otp=otp,
            username=user.employee_name or user.username,
        )
    except Exception as e:
        # Clean up the saved OTP so user can retry
        otp_store.consume_otp(str(data.email))
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again later.")

    return {"message": "OTP sent successfully."}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest):
    """
    Step 2 — user submits the OTP received in email.
    Marks the OTP as verified so reset-password can proceed.
    """
    ok = otp_store.verify_otp(str(data.email), data.otp)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return {"message": "OTP verified"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 3 — user submits new password.
    OTP must have been verified in Step 2.
    """
    if not otp_store.is_verified(str(data.email)):
        raise HTTPException(status_code=400, detail="OTP not verified or expired. Please restart the process.")

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    # Consume the OTP so it can't be reused
    otp_store.consume_otp(str(data.email))

    return {"message": "Password reset successfully"}
