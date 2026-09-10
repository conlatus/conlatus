import uuid
from typing import TYPE_CHECKING, Optional, Dict, Any
from sqlalchemy import ForeignKey, String, Text, JSON, Boolean, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.role import Role


class Question(Base, UUIDMixin, TimestampMixin):
    """
    Question entity representing curated and LLM-generated interview questions.
    """
    __tablename__ = "questions"

    role_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    difficulty: Mapped[Optional[str]] = mapped_column(String(50), default="medium", nullable=True)
    ideal_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rubric_criteria: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    is_curated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    role: Mapped[Optional["Role"]] = relationship(
        "Role",
        back_populates="questions",
    )

    def __repr__(self) -> str:
        return f"<Question id={self.id} category='{self.category}'>"
