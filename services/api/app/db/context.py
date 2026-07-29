from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

_session_maker: async_sessionmaker[AsyncSession] | None = None


@dataclass(frozen=True, slots=True)
class AppContext:
    """Request-independent runtime context for event handlers and background work."""

    session: AsyncSession
    organization_id: UUID | None = None


def configure_session_maker(session_maker: async_sessionmaker[AsyncSession]) -> None:
    global _session_maker
    _session_maker = session_maker


@asynccontextmanager
async def app_context(
    *,
    organization_id: UUID | None = None,
) -> AsyncIterator[AppContext]:
    if _session_maker is None:
        raise RuntimeError("Database session maker is not configured")
    async with _session_maker() as session:
        yield AppContext(session=session, organization_id=organization_id)
