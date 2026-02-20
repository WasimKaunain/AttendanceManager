import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password

load_dotenv()


def authenticate_user(db: Session, username: str, password: str):

    # --------------------------
    # ENV BASED ADMIN LOGIN
    # --------------------------
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_role = os.getenv("ADMIN_ROLE", "admin")

    if username == admin_username and password == admin_password:
        # Return fake user-like object
        return type("EnvAdmin", (), {
            "id": "env-admin",
            "role": admin_role
        })()

    # --------------------------
    # DATABASE USER LOGIN
    # --------------------------
    user = db.query(User).filter(User.username == username).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
