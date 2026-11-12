import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.agent import AgentSession
    from app.models.memory import ProjectMemory

class Project(Base):
    __tablename__ = "projects"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    primary_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    framework: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    recovery_status: Mapped[str] = mapped_column(String(50), default="not_started", nullable=False)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="projects")
    repository: Mapped[Optional["Repository"]] = relationship("Repository", back_populates="project", uselist=False, cascade="all, delete-orphan")
    agent_sessions: Mapped[List["AgentSession"]] = relationship("AgentSession", back_populates="project", cascade="all, delete-orphan")
    memories: Mapped[List["ProjectMemory"]] = relationship("ProjectMemory", back_populates="project", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    clone_url: Mapped[str] = mapped_column(String(512), nullable=False)
    provider_repo_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    scanned_tech_stack: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    last_scanned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    project: Mapped["Project"] = relationship("Project", back_populates="repository")
