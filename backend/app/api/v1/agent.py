from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.project import Project
from app.services.agent_service import gemini_agent

router = APIRouter(prefix="/agent", tags=["Agent & Intelligence"])

@router.post("/query", response_model=AgentQueryResponse, status_code=status.HTTP_200_OK)
async def query_agent(
    payload: AgentQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Query the FIIXO developer companion agent powered by Google Gemini API.
    Returns agent response along with live telemetry event records.
    Automatically binds active repository and updates project status.
    """
    history_dicts = [{"role": m.role, "text": m.text} for m in payload.conversation_history] if payload.conversation_history else []
    
    project_context = None
    if payload.project_id:
        stmt = (
            select(Project)
            .options(selectinload(Project.repository))
            .where(Project.id == payload.project_id)
        )
        res = await db.execute(stmt)
        proj = res.scalar_one_or_none()
        if proj:
            project_context = {
                "name": proj.name,
                "description": proj.description,
                "default_branch": proj.default_branch,
                "recovery_status": proj.recovery_status,
                "clone_url": proj.repository.clone_url if proj.repository else None
            }
            # Update recovery status to active analysis if currently not_started
            if proj.recovery_status == "not_started":
                proj.recovery_status = "analyzing"
                await db.commit()
    
    result = await gemini_agent.query_agent(
        prompt=payload.prompt,
        conversation_history=history_dicts,
        project_context=project_context
    )
    
    if payload.project_id:
        result["updated_recovery_status"] = "analyzing"
        
    return result
