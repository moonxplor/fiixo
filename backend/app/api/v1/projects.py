from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import (
    get_current_active_user,
    get_current_workspace_member,
    require_workspace_role
)
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.project import Project, Repository
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/workspaces/{workspace_id}/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    workspace_id: str,
    data: ProjectCreate,
    member: WorkspaceMember = Depends(require_workspace_role(WorkspaceRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project within a workspace and optionally connect a repository."""
    project = Project(
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        default_branch=data.default_branch,
        recovery_status="not_started"
    )
    db.add(project)
    await db.flush()
    
    if data.repository:
        repo = Repository(
            project_id=project.id,
            clone_url=data.repository.clone_url,
            default_branch=data.repository.default_branch,
            is_private=data.repository.is_private
        )
        db.add(repo)
        
    await db.commit()
    
    # Reload with repository relationship
    stmt = select(Project).options(selectinload(Project.repository)).where(Project.id == project.id)
    res = await db.execute(stmt)
    full_project = res.scalar_one()
    return full_project

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    workspace_id: str,
    member: WorkspaceMember = Depends(require_workspace_role(WorkspaceRole.MEMBER)),
    db: AsyncSession = Depends(get_db)
):
    """List all projects belonging to the specified workspace."""
    stmt = (
        select(Project)
        .options(selectinload(Project.repository))
        .where(Project.workspace_id == workspace_id)
        .order_by(Project.created_at.desc())
    )
    res = await db.execute(stmt)
    projects = res.scalars().all()
    return list(projects)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    workspace_id: str,
    project_id: str,
    member: WorkspaceMember = Depends(require_workspace_role(WorkspaceRole.MEMBER)),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details for a project, enforcing workspace tenant isolation."""
    stmt = (
        select(Project)
        .options(selectinload(Project.repository))
        .where(Project.id == project_id, Project.workspace_id == workspace_id)
    )
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found in this workspace"
        )
        
    return project
