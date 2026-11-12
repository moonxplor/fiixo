import secrets
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.core.security import encrypt_secret, decrypt_secret
from app.api.deps import get_current_active_user
from app.models.user import User, GitHubConnection
from app.schemas.integrations import (
    GitHubAuthURLResponse,
    GitHubConnectRequest,
    GitHubStatusResponse,
    GitHubRepositoryItem
)

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("/github/authorize", response_model=GitHubAuthURLResponse)
async def get_github_authorize_url(
    current_user: User = Depends(get_current_active_user)
):
    """Generate GitHub OAuth authorization URL with CSRF state token."""
    client_id = settings.GITHUB_CLIENT_ID or "mock_client_id"
    state = secrets.token_urlsafe(32)
    redirect_uri = settings.GITHUB_REDIRECT_URI or "http://localhost:5173/integrations/github/callback"
    scope = "read:user,repo"
    
    auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={scope}&"
        f"state={state}"
    )
    return GitHubAuthURLResponse(authorization_url=auth_url, state=state)

@router.post("/github/connect", response_model=GitHubStatusResponse)
async def connect_github(
    data: GitHubConnectRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Exchange GitHub OAuth authorization code for access token and persist encrypted at rest."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        # In development without real GitHub App credentials, support mock connection
        gh_user_id = "gh_123456"
        gh_username = f"octocat_{current_user.email.split('@')[0]}"
        token_str = f"gho_mock_token_{secrets.token_hex(16)}"
    else:
        # Real GitHub OAuth exchange
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": data.code,
                }
            )
            token_data = token_resp.json()
            if "error" in token_data or "access_token" not in token_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=token_data.get("error_description", "Failed to exchange GitHub authorization code")
                )
            token_str = token_data["access_token"]
            
            # Fetch user profile from GitHub
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {token_str}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            if user_resp.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch GitHub profile")
            gh_profile = user_resp.json()
            gh_user_id = str(gh_profile.get("id"))
            gh_username = gh_profile.get("login")

    # Encrypt token at rest using AES-256-GCM
    encrypted_token = encrypt_secret(token_str)
    
    # Upsert GitHubConnection for current user
    stmt = select(GitHubConnection).where(GitHubConnection.user_id == current_user.id)
    res = await db.execute(stmt)
    connection = res.scalar_one_or_none()
    
    if connection:
        connection.github_user_id = gh_user_id
        connection.github_username = gh_username
        connection.encrypted_access_token = encrypted_token
        connection.updated_at = datetime.now(timezone.utc)
    else:
        connection = GitHubConnection(
            user_id=current_user.id,
            github_user_id=gh_user_id,
            github_username=gh_username,
            encrypted_access_token=encrypted_token,
            scopes="read:user,repo"
        )
        db.add(connection)
        
    await db.commit()
    await db.refresh(connection)
    
    return GitHubStatusResponse(
        connected=True,
        github_username=connection.github_username,
        connected_at=connection.created_at
    )

@router.get("/github/status", response_model=GitHubStatusResponse)
async def get_github_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Check current user's GitHub integration status."""
    stmt = select(GitHubConnection).where(GitHubConnection.user_id == current_user.id)
    res = await db.execute(stmt)
    connection = res.scalar_one_or_none()
    
    if not connection:
        return GitHubStatusResponse(connected=False)
        
    return GitHubStatusResponse(
        connected=True,
        github_username=connection.github_username,
        connected_at=connection.created_at
    )

@router.delete("/github/disconnect", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_github(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Disconnect GitHub account and revoke stored tokens."""
    stmt = delete(GitHubConnection).where(GitHubConnection.user_id == current_user.id)
    await db.execute(stmt)
    await db.commit()
    return None

@router.get("/github/repos", response_model=List[GitHubRepositoryItem])
async def list_github_repositories(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List accessible GitHub repositories for the authenticated user using their decrypted token."""
    stmt = select(GitHubConnection).where(GitHubConnection.user_id == current_user.id)
    res = await db.execute(stmt)
    connection = res.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account not connected"
        )
        
    token = decrypt_secret(connection.encrypted_access_token)
    
    if token.startswith("gho_mock_token"):
        # Return mock repositories for development
        return [
            GitHubRepositoryItem(
                id=101,
                name="legacy-flask-api",
                full_name=f"{connection.github_username}/legacy-flask-api",
                private=False,
                html_url=f"https://github.com/{connection.github_username}/legacy-flask-api",
                clone_url=f"https://github.com/{connection.github_username}/legacy-flask-api.git",
                default_branch="master",
                description="Old Flask 0.12 API with broken Python 2.7 dependencies",
                language="Python"
            ),
            GitHubRepositoryItem(
                id=102,
                name="student-react-portfolio",
                full_name=f"{connection.github_username}/student-react-portfolio",
                private=True,
                html_url=f"https://github.com/{connection.github_username}/student-react-portfolio",
                clone_url=f"https://github.com/{connection.github_username}/student-react-portfolio.git",
                default_branch="main",
                description="Frontend portfolio with outdated Webpack and React 16",
                language="JavaScript"
            )
        ]
        
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos?per_page=100&sort=updated",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch repositories from GitHub")
        data = resp.json()
        return [
            GitHubRepositoryItem(
                id=r["id"],
                name=r["name"],
                full_name=r["full_name"],
                private=r["private"],
                html_url=r["html_url"],
                clone_url=r["clone_url"],
                default_branch=r.get("default_branch", "main"),
                description=r.get("description"),
                language=r.get("language")
            )
            for r in data
        ]
