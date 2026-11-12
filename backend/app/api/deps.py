from typing import Optional
from fastapi import Depends, HTTPException, Header, Path, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole

bearer_scheme = HTTPBearer(auto_error=False)

ROLE_HIERARCHY = {
    WorkspaceRole.MEMBER: 1,
    WorkspaceRole.ADMIN: 2,
    WorkspaceRole.OWNER: 3,
}

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Validate JWT access token and return the authenticated User."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth.credentials
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for API access",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user

async def get_current_workspace_member(
    workspace_id: str = Path(..., description="Target workspace UUID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> WorkspaceMember:
    """Validate that the authenticated user is an active member of the specified workspace."""
    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    result = await db.execute(stmt)
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied"
        )
        
    return member

def require_workspace_role(required_role: WorkspaceRole):
    """Dependency factory ensuring user has at least the required role in the target workspace."""
    async def role_checker(
        member: WorkspaceMember = Depends(get_current_workspace_member)
    ) -> WorkspaceMember:
        user_level = ROLE_HIERARCHY.get(member.role, 0)
        required_level = ROLE_HIERARCHY.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires at least '{required_role.value}' role in this workspace"
            )
        return member
    return role_checker

async def require_platform_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure the user has platform administrator privileges."""
    if not current_user.is_platform_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform administrator access required"
        )
    return current_user
