"""
In-memory OTP store.
Each entry: { email -> {"otp": str, "expires_at": datetime, "verified": bool} }
OTPs are valid for 10 minutes.
"""
from datetime import datetime, timedelta
import random
import string

OTP_TTL_MINUTES = 10

_store: dict[str, dict] = {}


def generate_otp() -> str:
    """Return a random 6-digit numeric OTP."""
    return "".join(random.choices(string.digits, k=6))


def save_otp(email: str, otp: str) -> None:
    _store[email.lower()] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
        "verified": False,
    }


def verify_otp(email: str, otp: str) -> bool:
    """
    Returns True and marks as verified if OTP matches and is not expired.
    Returns False otherwise.
    """
    entry = _store.get(email.lower())
    if not entry:
        return False
    if datetime.utcnow() > entry["expires_at"]:
        _store.pop(email.lower(), None)
        return False
    if entry["otp"] != otp:
        return False
    # Mark verified so reset-password can proceed
    _store[email.lower()]["verified"] = True
    return True


def is_verified(email: str) -> bool:
    """Check whether this email has a verified (but not yet consumed) OTP."""
    entry = _store.get(email.lower())
    if not entry:
        return False
    if datetime.utcnow() > entry["expires_at"]:
        _store.pop(email.lower(), None)
        return False
    return entry.get("verified", False)


def consume_otp(email: str) -> None:
    """Remove the OTP after a successful password reset."""
    _store.pop(email.lower(), None)
