import uuid
from typing import TYPE_CHECKING, Optional, Dict, Any
from sqlalchemy import ForeignKey, String, Text, Float, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.interview import Interview


class Report(Base, UUIDMixin, TimestampMixin):
    """
    Report entity storing AI-scored evaluations, rubric breakdowns, and human recruiter decisions.
    """
    __tablename__ = "reports"

    interview_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interviews.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    recommendation: Mapped[str] = mapped_column(String(50), nullable=False)  # strong_hire, hire, no_hire
    rubric_breakdown: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    synthesis_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    human_decision: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # accepted, rejected, pending
    human_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    interview: Mapped["Interview"] = relationship("Interview", back_populates="report")

    def __repr__(self) -> str:
        return f"<Report id={self.id} score={self.overall_score} recommendation='{self.recommendation}'>"
