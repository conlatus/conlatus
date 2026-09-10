import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String, Boolean, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.company import Company
    from models.interview import Interview


class User(Base, UUIDMixin, TimestampMixin):
    """
    User entity representing Admin / Recruiter accounts.
    """
    __tablename__ = "users"

    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="recruiter", nullable=False)  # admin / recruiter
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    company: Mapped[Optional["Company"]] = relationship(
        "Company",
        back_populates="users",
    )
    interviews: Mapped[List["Interview"]] = relationship(
        "Interview",
        back_populates="user",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"
