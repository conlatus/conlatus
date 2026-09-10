from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from core.database import get_db
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from models.company import Company
from models.user import User
from schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Authorization"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new recruiter or admin account",
)
async def register(
    req: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new user account, creating company metadata if specified."""
    # 1. Check if user already exists
    existing_stmt = select(User).where(User.email == req.email.lower())
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Find or create company if company_name provided
    company_id = None
    if req.company_name:
        comp_stmt = select(Company).where(Company.name == req.company_name)
        comp_res = await db.execute(comp_stmt)
        company = comp_res.scalar_one_or_none()
        if not company:
            company = Company(name=req.company_name)
            db.add(company)
            await db.flush()
        company_id = company.id

    # 3. Create user
    user = User(
        email=req.email.lower(),
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role=req.role.lower() if req.role in ["admin", "recruiter"] else "recruiter",
        company_id=company_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 4. Generate JWT tokens
    token_payload = {"sub": str(user.id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    # 5. Set HTTP-only cookie for web clients
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=3600,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate recruiter/admin credentials and obtain JWT tokens",
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    req: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticates credentials against stored password hashes. Rate-limited to prevent brute-force attacks."""
    stmt = select(User).where(User.email == req.email.lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact system administrator.",
        )

    token_payload = {"sub": str(user.id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=3600,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Issue a new access token using a valid refresh token",
)
async def refresh_token_endpoint(
    req: RefreshTokenRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Exchanges a valid refresh token for a fresh access token pair."""
    payload = decode_token(req.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type provided for refresh",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )

    import uuid
    stmt = select(User).where(User.id == uuid.UUID(user_id_str))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found",
        )

    token_payload = {"sub": str(user.id), "email": user.email, "role": user.role}
    new_access_token = create_access_token(token_payload)
    new_refresh_token = create_refresh_token(token_payload)

    response.set_cookie(
        key="auth_token",
        value=new_access_token,
        httponly=True,
        samesite="lax",
        max_age=3600,
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the details of the currently authenticated recruiter/admin user."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    summary="Logout user and invalidate authentication cookie",
)
async def logout(response: Response):
    """Clears the authentication cookie."""
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}
