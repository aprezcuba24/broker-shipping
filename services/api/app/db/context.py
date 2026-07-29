from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

_session_maker: async_sessionmaker[AsyncSession] | None = None


def configure_session_maker(session_maker: async_sessionmaker[AsyncSession]) -> None:
    global _session_maker
    _session_maker = session_maker


@asynccontextmanager
async def background_session() -> AsyncIterator[AsyncSession]:
    if _session_maker is None:
        raise RuntimeError("Database session maker is not configured")
    async with _session_maker() as session:
        yield session
