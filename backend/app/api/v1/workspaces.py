from typing import List
from fastapi import APIRouter, Depends, status, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import (
    get_current_active_user,
    get_current_workspace_member,
    require_workspace_role
)
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceMemberAddRequest,
    WorkspaceMemberResponse
)
from app.services import workspace_service

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workspace with the authenticated user as owner."""
    return await workspace_service.create_workspace(db, current_user, data)

@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all workspaces the authenticated user belongs to."""
    return await workspace_service.list_user_workspaces(db, current_user)

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    member: WorkspaceMember = Depends(get_current_workspace_member),
    db: AsyncSession = Depends(get_db)
):
    """Get details for a specific workspace the user belongs to."""
    return await workspace_service.get_workspace(db, workspace_id, current_user)

@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_members(
    workspace_id: str,
    member: WorkspaceMember = Depends(require_workspace_role(WorkspaceRole.MEMBER)),
    db: AsyncSession = Depends(get_db)
):
    """List all members of a workspace (requires Member, Admin, or Owner)."""
    return await workspace_service.list_members(db, workspace_id)

@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    workspace_id: str,
    data: WorkspaceMemberAddRequest,
    member: WorkspaceMember = Depends(require_workspace_role(WorkspaceRole.ADMIN)),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a registered user to the workspace by email (requires Admin or Owner)."""
    return await workspace_service.add_member(db, workspace_id, data.email, data.role, current_user)

@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: str,
    user_id: str = Path(..., description="Target user ID to remove"),
    member: WorkspaceMember = Depends(require_workspace_role(WorkspaceRole.ADMIN)),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a member from the workspace (requires Admin or Owner)."""
    await workspace_service.remove_member(db, workspace_id, user_id, current_user.id)
    return None
