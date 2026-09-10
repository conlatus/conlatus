import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional, Dict, Any
from sqlalchemy import ForeignKey, String, Text, DateTime, JSON, UUID, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.interview import Interview


class Transcript(Base, UUIDMixin, TimestampMixin):
    """
    Transcript entity storing turn-by-turn dialogue exchanges during an interview.
    """
    __tablename__ = "transcripts"

    interview_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    speaker: Mapped[str] = mapped_column(String(50), nullable=False)  # interviewer / candidate
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    interview: Mapped["Interview"] = relationship("Interview", back_populates="transcripts")

    def __repr__(self) -> str:
        return f"<Transcript id={self.id} speaker='{self.speaker}'>"
