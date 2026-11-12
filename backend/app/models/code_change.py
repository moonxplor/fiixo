import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.agent import AgentTask
    from app.models.user import User

class CodeChange(Base):
    __tablename__ = "code_changes"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_tasks.id", ondelete="CASCADE"), index=True, nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    original_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    proposed_content: Mapped[str] = mapped_column(Text, nullable=False)
    unified_diff: Mapped[str] = mapped_column(Text, nullable=False)
    target_branch: Mapped[str] = mapped_column(String(100), default="fiixo/repair-session", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False) # pending | approved | rejected | applied | reverted
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    task: Mapped["AgentTask"] = relationship("AgentTask", back_populates="code_changes")
    approvals: Mapped[List["Approval"]] = relationship("Approval", back_populates="code_change", cascade="all, delete-orphan")

class Approval(Base):
    __tablename__ = "approvals"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code_change_id: Mapped[str] = mapped_column(String(36), ForeignKey("code_changes.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    decision: Mapped[str] = mapped_column(String(50), nullable=False) # approve | reject
    feedback_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    code_change: Mapped["CodeChange"] = relationship("CodeChange", back_populates="approvals")
    user: Mapped["User"] = relationship("User")
