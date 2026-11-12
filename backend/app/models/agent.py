import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.code_change import CodeChange

class AgentSession(Base):
    __tablename__ = "agent_sessions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    mode: Mapped[str] = mapped_column(String(50), default="mentor", nullable=False) # mentor | autonomous | custom
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False) # active | paused | completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="agent_sessions")
    tasks: Mapped[List["AgentTask"]] = relationship("AgentTask", back_populates="session", cascade="all, delete-orphan")

class AgentTask(Base):
    __tablename__ = "agent_tasks"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    current_state: Mapped[str] = mapped_column(String(50), default="planning", nullable=False)
    total_tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    session: Mapped["AgentSession"] = relationship("AgentSession", back_populates="tasks")
    events: Mapped[List["AgentEvent"]] = relationship("AgentEvent", back_populates="task", cascade="all, delete-orphan", order_by="AgentEvent.sequence_number")
    code_changes: Mapped[List["CodeChange"]] = relationship("CodeChange", back_populates="task", cascade="all, delete-orphan")

class AgentEvent(Base):
    __tablename__ = "agent_events"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_tasks.id", ondelete="CASCADE"), index=True, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    action_name: Mapped[str] = mapped_column(String(200), nullable=False)
    user_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    technical_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actual_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    task: Mapped["AgentTask"] = relationship("AgentTask", back_populates="events")

class ToolExecution(Base):
    __tablename__ = "tool_executions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_tasks.id", ondelete="CASCADE"), index=True, nullable=False)
    tool_name: Mapped[str] = mapped_column(String(100), nullable=False)
    input_parameters: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    output_result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="success", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
