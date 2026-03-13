from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.core.security import verify_password


def authenticate_user(db: Session, username: str, password: str):
    """
    Authenticate by username OR email (for admin users). Case-insensitive lookup.
    Returns the User ORM object on success, None on failure.
    """
    uname = (username or "").strip()

    # Case-insensitive username lookup
    user = db.query(User).filter(func.lower(User.username) == uname.lower()).first()

    # If not found by username, try email (admin login via email), case-insensitive
    if not user:
        user = db.query(User).filter(func.lower(User.email) == uname.lower()).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if user.status != "active":
        return None

    return user
