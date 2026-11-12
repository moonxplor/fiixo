from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

class RepositoryCreate(BaseModel):
    clone_url: str = Field(..., description="Git clone URL (HTTPS or SSH)")
    default_branch: str = Field("main", max_length=100)
    is_private: bool = False

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    default_branch: str = "main"
    repository: Optional[RepositoryCreate] = None

class RepositoryResponse(BaseModel):
    id: str
    clone_url: str
    is_private: bool
    default_branch: str
    scanned_tech_stack: Optional[Dict[str, Any]] = None
    last_scanned_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProjectResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    default_branch: str
    primary_language: Optional[str] = None
    framework: Optional[str] = None
    recovery_status: str
    metadata_json: Optional[Dict[str, Any]] = None
    repository: Optional[RepositoryResponse] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
