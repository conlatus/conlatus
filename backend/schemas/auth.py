import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for recruiter/admin login requests."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Plain-text password")


class RegisterRequest(BaseModel):
    """Schema for new recruiter/admin registration requests."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: str = Field(..., min_length=2, description="Full name of user")
    company_name: Optional[str] = Field(default=None, description="Company/Organization name")
    role: str = Field(default="recruiter", description="Role: 'recruiter' or 'admin'")


class RefreshTokenRequest(BaseModel):
    """Schema for requesting a new access token via refresh token."""
    refresh_token: str = Field(..., description="Valid refresh token")


class UserResponse(BaseModel):
    """Public user response schema."""
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    company_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema containing JWT tokens and user payload."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
