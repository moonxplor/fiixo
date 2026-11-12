import re
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User, RefreshToken
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.schemas.auth import UserRegisterRequest, TokenResponse, UserResponse, ActiveWorkspaceInfo

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "workspace"

async def register_user(db: AsyncSession, data: UserRegisterRequest) -> TokenResponse:
    # 1. Check if user already exists
    existing_stmt = select(User).where(User.email == data.email.lower())
    result = await db.execute(existing_stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists"
        )
        
    # 2. Create User record
    hashed_pwd = hash_password(data.password)
    new_user = User(
        email=data.email.lower(),
        hashed_password=hashed_pwd,
        full_name=data.full_name,
        is_active=True,
        is_verified=False # Email verification flow ready
    )
    db.add(new_user)
    await db.flush() # Populate new_user.id
    
    # 3. Create default personal workspace
    ws_name = data.workspace_name or (f"{data.full_name}'s Workspace" if data.full_name else "Personal Workspace")
    base_slug = slugify(ws_name)
    slug = f"{base_slug}-{new_user.id[:8]}"
    
    workspace = Workspace(
        name=ws_name,
        slug=slug,
        owner_id=new_user.id,
        plan_tier="free",
        quota_limits={
            "max_projects": 5,
            "max_members": 3,
            "daily_tokens": 100000
        }
    )
    db.add(workspace)
    await db.flush()
    
    # 4. Add User as Workspace Owner
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=new_user.id,
        role=WorkspaceRole.OWNER
    )
    db.add(member)
    
    # 5. Issue Tokens
    access_token = create_access_token(
        subject=new_user.id,
        workspace_id=workspace.id,
        role=WorkspaceRole.OWNER.value
    )
    refresh_token = create_refresh_token(subject=new_user.id)
    
    # Store refresh token hash
    rt_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    rt_record = RefreshToken(
        user_id=new_user.id,
        token_hash=rt_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(rt_record)
    await db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(new_user),
        active_workspace=ActiveWorkspaceInfo(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            role=WorkspaceRole.OWNER.value
        )
    )

async def authenticate_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    stmt = select(User).where(User.email == email.lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
        
    # Get user's primary/default workspace (e.g. one they own or are member of)
    ws_stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(Workspace.created_at.asc())
    )
    ws_result = await db.execute(ws_stmt)
    ws_row = ws_result.first()
    
    active_ws_info = None
    role_str = None
    ws_id = None
    
    if ws_row:
        workspace, role = ws_row
        ws_id = workspace.id
        role_str = role.value if hasattr(role, "value") else str(role)
        active_ws_info = ActiveWorkspaceInfo(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            role=role_str
        )
        
    access_token = create_access_token(
        subject=user.id,
        workspace_id=ws_id,
        role=role_str
    )
    refresh_token = create_refresh_token(subject=user.id)
    
    rt_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    rt_record = RefreshToken(
        user_id=user.id,
        token_hash=rt_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(rt_record)
    await db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
        active_workspace=active_ws_info
    )

async def rotate_refresh_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
        
    user_id = payload.get("sub")
    rt_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    
    stmt = select(RefreshToken).where(
        RefreshToken.token_hash == rt_hash,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    )
    result = await db.execute(stmt)
    token_record = result.scalar_one_or_none()
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or has been revoked"
        )
        
    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or has been revoked"
        )
        
    # Revoke old refresh token (Single-use rotation)
    token_record.revoked = True
    
    # Query user
    user_stmt = select(User).where(User.id == user_id, User.is_active == True)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    # Get active workspace
    ws_stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(Workspace.created_at.asc())
    )
    ws_result = await db.execute(ws_stmt)
    ws_row = ws_result.first()
    
    active_ws_info = None
    role_str = None
    ws_id = None
    if ws_row:
        workspace, role = ws_row
        ws_id = workspace.id
        role_str = role.value if hasattr(role, "value") else str(role)
        active_ws_info = ActiveWorkspaceInfo(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            role=role_str
        )
        
    new_access_token = create_access_token(subject=user.id, workspace_id=ws_id, role=role_str)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    new_rt_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()
    new_rt_record = RefreshToken(
        user_id=user.id,
        token_hash=new_rt_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_rt_record)
    await db.commit()
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
        active_workspace=active_ws_info
    )

async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> None:
    rt_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    stmt = select(RefreshToken).where(RefreshToken.token_hash == rt_hash)
    result = await db.execute(stmt)
    token_record = result.scalar_one_or_none()
    if token_record:
        token_record.revoked = True
        await db.commit()
