from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class GitHubAuthURLResponse(BaseModel):
    authorization_url: str
    state: str

class GitHubConnectRequest(BaseModel):
    code: str
    state: str

class GitHubStatusResponse(BaseModel):
    connected: bool
    github_username: Optional[str] = None
    connected_at: Optional[datetime] = None

class GitHubRepositoryItem(BaseModel):
    id: int
    name: str
    full_name: str
    private: bool
    html_url: str
    clone_url: str
    default_branch: str
    description: Optional[str] = None
    language: Optional[str] = None
