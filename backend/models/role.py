import uuid
from typing import TYPE_CHECKING, List, Dict, Any, Optional
from sqlalchemy import ForeignKey, String, Text, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.company import Company
    from models.question import Question
    from models.interview import Interview


class Role(Base, UUIDMixin, TimestampMixin):
    """
    Role entity representing job roles, competency definitions, and rubric JSON.
    """
    __tablename__ = "roles"

    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    competencies: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    rubric: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    company: Mapped[Optional["Company"]] = relationship(
        "Company",
        back_populates="roles",
    )
    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    interviews: Mapped[List["Interview"]] = relationship(
        "Interview",
        back_populates="role",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Role id={self.id} title='{self.title}'>"
