from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


def require_site_incharge(user=Depends(get_current_user)):
    """Allow only site_incharge role with an assigned site."""
    role = user.get("role")
    if role != "site_incharge":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Site incharge access required"
        )
    if not user.get("site_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No site assigned to this account. Contact admin."
        )
    return user


def require_site_incharge_only(user=Depends(get_current_user)):
    """Alias for explicitness in endpoints that must never allow admin."""
    return require_site_incharge(user)


def require_mobile_user(user=Depends(get_current_user)):
    """Allow mobile access for site_incharge and admin roles."""
    role = user.get("role")
    if role not in {"site_incharge", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or site incharge can use mobile APIs"
        )

    if role == "site_incharge" and not user.get("site_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No site assigned to this account. Contact admin."
        )
    return user


def get_site_id_or_raise(user: dict) -> str:
    """Resolve effective site context for mobile requests.

    - site_incharge: fixed to JWT `site_id`
    - admin: must use a scoped token containing `selected_site_id` (or `site_id` fallback)
    """
    role = user.get("role")

    if role == "site_incharge":
        site_id = user.get("site_id")
        if not site_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No site assigned to this account."
            )
        return site_id

    if role == "admin":
        site_id = user.get("selected_site_id") or user.get("site_id")
        if not site_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin must select a site first in mobile app."
            )
        return site_id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unsupported role for site-scoped mobile API"
    )
