import logging
from typing import AsyncGenerator
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import settings

logger = logging.getLogger(__name__)

# Create the primary asynchronous engine
engine: AsyncEngine = create_async_engine(
    settings.async_database_url,
    **settings.engine_kwargs,
)

# Listen for SQLite connections to enable PRAGMAs (Foreign keys and WAL mode)
if settings.is_sqlite:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.close()

# Session factory for generating AsyncSession instances
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session.
    Automatically commits successful operations, rolls back on exceptions,
    and closes the session cleanly upon completion.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error(f"Database session error: {exc}")
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Asynchronously creates all defined tables if they do not exist.
    Useful for testing environments and rapid SQLite bootstrapping.
    """
    import models  # Ensure all SQLAlchemy models are registered
    from models.base import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

