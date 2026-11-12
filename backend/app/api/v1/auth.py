from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    rotate_refresh_token,
    revoke_refresh_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user account and provision their initial workspace."""
    return await register_user(db, data)

@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate with email and password and receive JWT session tokens."""
    return await authenticate_user(db, data.email, data.password)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Rotate an existing refresh token for a new access/refresh token pair."""
    return await rotate_refresh_token(db, data.refresh_token)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Revoke a refresh token on user logout."""
    await revoke_refresh_token(db, data.refresh_token)
    return None

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve profile information for the authenticated user."""
    return current_user
