import uuid
import enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Enum, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project

class WorkspaceRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    plan_tier: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    quota_limits: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    members: Mapped[List["WorkspaceMember"]] = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[WorkspaceRole] = mapped_column(Enum(WorkspaceRole, native_enum=False), default=WorkspaceRole.MEMBER, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_member"),
    )
    
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="workspace_memberships")
