from collections.abc import AsyncIterator

from fastapi import Request
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.lib.post_commit import get_or_init_post_commit_queue


def create_async_engine_and_session_maker(
    database_url: str,
) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(database_url)
    session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return engine, session_maker


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    session_maker: async_sessionmaker[AsyncSession] = request.app.state.async_session_maker
    post_commit = get_or_init_post_commit_queue(request)
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            post_commit.discard()
            await session.rollback()
            raise
        await post_commit.drain()
