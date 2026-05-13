from collections.abc import AsyncIterator

from dishka import Provider, Scope, provide
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import Settings, settings
from app.lib.event_dispatcher import EventDispatcher
from app.lib.post_commit import PostCommitQueue


class AppProvider(Provider):
    """Central Dishka provider.

    APP scope  — singletons that live for the entire process lifetime.
    REQUEST scope — one instance per HTTP request, listener invocation, or
                    background-task execution.
    """

    # ── APP scope ────────────────────────────────────────────

    @provide(scope=Scope.APP)
    def get_settings(self) -> Settings:
        return settings

    @provide(scope=Scope.APP)
    async def get_engine(self, s: Settings) -> AsyncIterator[AsyncEngine]:
        engine = create_async_engine(s.database_url)
        yield engine
        await engine.dispose()

    @provide(scope=Scope.APP)
    def get_session_maker(
        self, engine: AsyncEngine
    ) -> async_sessionmaker[AsyncSession]:
        return async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

    @provide(scope=Scope.APP)
    async def get_redis(self, s: Settings) -> AsyncIterator[Redis]:
        redis = Redis.from_url(s.redis_url, decode_responses=True)
        yield redis
        await redis.aclose()

    @provide(scope=Scope.APP)
    def get_dispatcher(self) -> EventDispatcher:
        return EventDispatcher()

    # ── REQUEST scope ─────────────────────────────────────────

    @provide(scope=Scope.REQUEST)
    def get_post_commit_queue(self) -> PostCommitQueue:
        return PostCommitQueue()

    @provide(scope=Scope.REQUEST)
    async def get_session(
        self,
        session_maker: async_sessionmaker[AsyncSession],
        post_commit: PostCommitQueue,
    ) -> AsyncIterator[AsyncSession]:
        """Open a session, commit on success, rollback + discard queue on error,
        then drain the post-commit queue (which fires domain events)."""
        async with session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                post_commit.discard()
                await session.rollback()
                raise
            await post_commit.drain()
