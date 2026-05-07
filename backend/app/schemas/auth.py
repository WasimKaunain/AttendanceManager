from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal


class LoginRequest(BaseModel):
    username: str
    password: str
    login_as: Optional[Literal["admin", "site_incharge"]] = None
    # If true, server will not attach site_id/site_name in token for site_incharge.
    # This keeps the currently deployed APK unaffected (it does not send this field).
    unscoped_site_incharge: Optional[bool] = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")
    role: str
    site_id: Optional[str] = None
    site_name: Optional[str] = None
    selected_site_id: Optional[str] = None
    selected_site_name: Optional[str] = None


# ── Forgot Password flow ──────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6)
