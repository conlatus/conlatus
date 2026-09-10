import uuid
from datetime import datetime
from sqlalchemy import UUID, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy declarative models.
    """
    pass


class UUIDMixin:
    """
    Mixin providing UUID v4 primary key `id`.
    Compatible with PostgreSQL native UUID and SQLite binary/string UUID.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    """
    Mixin providing timezone-aware `created_at` and `updated_at` columns.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
