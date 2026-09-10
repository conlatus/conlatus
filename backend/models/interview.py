import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String, DateTime, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.role import Role
    from models.user import User
    from models.transcript import Transcript
    from models.report import Report


class Interview(Base, UUIDMixin, TimestampMixin):
    """
    Interview entity representing an interview instance, access tokens, and status lifecycle.
    """
    __tablename__ = "interviews"

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    candidate_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="created", nullable=False)  # created, in_progress, completed, expired

    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="interviews")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="interviews")
    transcripts: Mapped[List["Transcript"]] = relationship(
        "Transcript",
        back_populates="interview",
        cascade="all, delete-orphan",
        order_by="Transcript.timestamp",
        lazy="selectin",
    )
    report: Mapped[Optional["Report"]] = relationship(
        "Report",
        back_populates="interview",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Interview id={self.id} candidate='{self.candidate_name}' status='{self.status}'>"
