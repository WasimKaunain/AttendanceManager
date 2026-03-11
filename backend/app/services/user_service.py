from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password


def authenticate_user(db: Session, username: str, password: str):
    """
    Authenticate by username OR email (for admin users).
    Returns the User ORM object on success, None on failure.
    """
    # Try username first
    user = db.query(User).filter(User.username == username).first()

    # If not found by username, try email (admin login via email)
    if not user:
        user = db.query(User).filter(User.email == username).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if user.status != "active":
        return None

    return user
