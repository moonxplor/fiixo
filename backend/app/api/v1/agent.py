from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse
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
    """
    history_dicts = [{"role": m.role, "text": m.text} for m in payload.conversation_history] if payload.conversation_history else []
    
    result = await gemini_agent.query_agent(
        prompt=payload.prompt,
        conversation_history=history_dicts
    )
    
    return result
