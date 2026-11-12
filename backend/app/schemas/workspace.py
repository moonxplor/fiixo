from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.workspace import WorkspaceRole

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(None, min_length=2, max_length=100)

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    owner_id: str
    plan_tier: str
    quota_limits: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    role: Optional[str] = None # Role of the requesting user
    
    model_config = ConfigDict(from_attributes=True)

class WorkspaceMemberAddRequest(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.MEMBER

class WorkspaceMemberUpdateRequest(BaseModel):
    role: WorkspaceRole

class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: WorkspaceRole
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
