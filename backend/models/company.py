from typing import TYPE_CHECKING, List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from models.user import User
    from models.role import Role


class Company(Base, UUIDMixin, TimestampMixin):
    """
    Company / Organization entity storing company metadata.
    """
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Company id={self.id} name='{self.name}'>"
