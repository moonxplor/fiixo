from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AgentMessage(BaseModel):
    role: str
    text: str

class AgentQueryRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or instruction for FIIXO")
    project_id: Optional[str] = Field(default=None, description="Optional active project ID")
    conversation_history: Optional[List[AgentMessage]] = Field(default_factory=list)

class TelemetryEvent(BaseModel):
    action: str
    tool: str
    reason: str
    result: str
    status: str
    duration: str

class AgentQueryResponse(BaseModel):
    response: str
    model_used: str
    telemetry: List[TelemetryEvent]
