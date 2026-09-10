import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import decode_token
from models.user import User

# OAuth2 scheme extracting Bearer token from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_token_from_header_or_cookie(
    request: Request,
    header_token: Optional[str] = Depends(oauth2_scheme),
) -> str:
    """Extracts JWT token from Authorization header or 'auth_token' cookie."""
    if header_token:
        return header_token

    cookie_token = request.cookies.get("auth_token")
    if cookie_token:
        return cookie_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Missing Authorization header or auth_token cookie.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: str = Depends(get_token_from_header_or_cookie),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency fetching and validating the authenticated User.
    Raises 401 Unauthorized if token is invalid, expired, or user is inactive.
    """
    payload = decode_token(token)

    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for user authentication",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload: missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account has been deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    FastAPI dependency enforcing Administrator or Recruiter role RBAC.
    Raises 403 Forbidden if user role is not 'admin' or 'recruiter'.
    """
    if current_user.role.lower() not in ("admin", "recruiter"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Recruiter or Administrator privileges required.",
        )
    return current_user


async def get_candidate_token(
    request: Request,
    header_token: Optional[str] = Depends(oauth2_scheme),
) -> str:
    """Extracts candidate JWT token from Authorization header or candidate_token/auth_token cookie."""
    if header_token:
        return header_token

    cookie_token = request.cookies.get("candidate_token") or request.cookies.get("auth_token")
    if cookie_token:
        return cookie_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Missing Authorization header or candidate token cookie.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def verify_interview_token(
    token: str = Depends(get_candidate_token),
) -> dict:
    """
    Validates a candidate interview session token.
    Raises 401 Unauthorized if candidate token is invalid or expired.
    """
    payload = decode_token(token)
    if payload.get("type") != "interview_session":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for candidate interview session",
        )
    return payload
