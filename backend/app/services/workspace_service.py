import re
from typing import List, Tuple, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, WorkspaceMemberResponse

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "workspace"

async def create_workspace(db: AsyncSession, user: User, data: WorkspaceCreate) -> WorkspaceResponse:
    base_slug = data.slug or slugify(data.name)
    slug = base_slug
    counter = 1
    
    # Ensure unique slug
    while True:
        stmt = select(Workspace).where(Workspace.slug == slug)
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1
        
    workspace = Workspace(
        name=data.name,
        slug=slug,
        owner_id=user.id,
        plan_tier="free",
        quota_limits={
            "max_projects": 5,
            "max_members": 3,
            "daily_tokens": 100000
        }
    )
    db.add(workspace)
    await db.flush()
    
    # Add creator as owner
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role=WorkspaceRole.OWNER
    )
    db.add(member)
    await db.commit()
    await db.refresh(workspace)
    
    resp = WorkspaceResponse.model_validate(workspace)
    resp.role = WorkspaceRole.OWNER.value
    return resp

async def list_user_workspaces(db: AsyncSession, user: User) -> List[WorkspaceResponse]:
    stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(Workspace.created_at.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    output = []
    for ws, role in rows:
        item = WorkspaceResponse.model_validate(ws)
        item.role = role.value if hasattr(role, "value") else str(role)
        output.append(item)
    return output

async def get_workspace(db: AsyncSession, workspace_id: str, user: User) -> WorkspaceResponse:
    stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(Workspace.id == workspace_id, WorkspaceMember.user_id == user.id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied"
        )
    ws, role = row
    item = WorkspaceResponse.model_validate(ws)
    item.role = role.value if hasattr(role, "value") else str(role)
    return item

async def list_members(db: AsyncSession, workspace_id: str) -> List[WorkspaceMemberResponse]:
    stmt = (
        select(WorkspaceMember, User.email, User.full_name)
        .join(User, User.id == WorkspaceMember.user_id)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    members = []
    for member, email, full_name in rows:
        members.append(WorkspaceMemberResponse(
            id=member.id,
            workspace_id=member.workspace_id,
            user_id=member.user_id,
            email=email,
            full_name=full_name,
            role=member.role,
            joined_at=member.joined_at
        ))
    return members

async def add_member(
    db: AsyncSession,
    workspace_id: str,
    email: str,
    role: WorkspaceRole,
    actor: User
) -> WorkspaceMemberResponse:
    # 1. Lookup user by email
    stmt = select(User).where(User.email == email.lower())
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user registered with this email address"
        )
        
    # 2. Check if already a member
    mem_stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == target_user.id
    )
    mem_res = await db.execute(mem_stmt)
    if mem_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this workspace"
        )
        
    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=target_user.id,
        role=role
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)
    
    return WorkspaceMemberResponse(
        id=new_member.id,
        workspace_id=new_member.workspace_id,
        user_id=target_user.id,
        email=target_user.email,
        full_name=target_user.full_name,
        role=new_member.role,
        joined_at=new_member.joined_at
    )

async def remove_member(
    db: AsyncSession,
    workspace_id: str,
    target_user_id: str,
    actor_id: str
) -> None:
    # Cannot remove workspace owner
    ws_stmt = select(Workspace).where(Workspace.id == workspace_id)
    ws_res = await db.execute(ws_stmt)
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace.owner_id == target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the workspace owner"
        )
        
    del_stmt = delete(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == target_user_id
    )
    await db.execute(del_stmt)
    await db.commit()
