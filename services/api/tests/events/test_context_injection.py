from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from unittest.mock import patch
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.db.context import AppContext, app_context, configure_session_maker
from app.db import context as context_mod
from app.db.inject import inject_app_context
from app.lib.events.bus import EventBus
from app.lib.events.registry import _wrap_handler

pytestmark = pytest.mark.asyncio(loop_scope="session")


@dataclass(frozen=True)
class _SampleEvent:
    value: str


@pytest.fixture
def configured_session_maker(
    test_engine: AsyncEngine,
) -> Iterator[async_sessionmaker[AsyncSession]]:
    previous = context_mod._session_maker
    session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    configure_session_maker(session_maker)
    try:
        yield session_maker
    finally:
        context_mod._session_maker = previous


async def test_inject_provides_app_context(
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    seen: list[AppContext] = []

    async def handler(_event: _SampleEvent, ctx: AppContext) -> None:
        seen.append(ctx)
        assert isinstance(ctx.session, AsyncSession)
        assert ctx.organization_id is None

    wrapped = inject_app_context(handler)
    await wrapped(_SampleEvent("x"))
    assert len(seen) == 1


async def test_inject_noop_without_app_context_param() -> None:
    calls: list[str] = []

    async def handler(event: _SampleEvent) -> None:
        calls.append(event.value)

    wrapped = inject_app_context(handler)
    assert wrapped is handler
    with patch("app.db.inject.app_context") as mock_ctx:
        await wrapped(_SampleEvent("no-db"))
    mock_ctx.assert_not_called()
    assert calls == ["no-db"]


async def test_inject_closes_session_after_handler(
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    closed = False

    async def handler(_event: _SampleEvent, ctx: AppContext) -> None:
        nonlocal closed
        real_close = ctx.session.close

        async def tracking_close() -> None:
            nonlocal closed
            await real_close()
            closed = True

        ctx.session.close = tracking_close  # type: ignore[method-assign]

    wrapped = inject_app_context(handler)
    await wrapped(_SampleEvent("x"))
    assert closed


async def test_inject_closes_session_on_handler_error(
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    closed = False

    async def handler(_event: _SampleEvent, ctx: AppContext) -> None:
        nonlocal closed
        real_close = ctx.session.close

        async def tracking_close() -> None:
            nonlocal closed
            await real_close()
            closed = True

        ctx.session.close = tracking_close  # type: ignore[method-assign]
        raise RuntimeError("boom")

    wrapped = inject_app_context(handler)
    with pytest.raises(RuntimeError, match="boom"):
        await wrapped(_SampleEvent("x"))
    assert closed


async def test_bus_dispatches_injected_handler(
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    bus = EventBus()
    seen: list[str] = []

    async def handler(event: _SampleEvent, ctx: AppContext) -> None:
        assert isinstance(ctx.session, AsyncSession)
        seen.append(event.value)

    bus.subscribe(_SampleEvent, inject_app_context(handler))
    await bus.emit(_SampleEvent("via-bus"))
    assert seen == ["via-bus"]


async def test_wrapped_injected_handler_failure_is_swallowed(
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    bus = EventBus()
    seen: list[str] = []

    async def boom(_event: _SampleEvent, ctx: AppContext) -> None:
        assert ctx.session is not None
        raise RuntimeError("boom")

    async def ok(event: _SampleEvent) -> None:
        seen.append(event.value)

    bus.subscribe(
        _SampleEvent,
        _wrap_handler(inject_app_context(boom), _SampleEvent, "boom"),
    )
    bus.subscribe(_SampleEvent, ok)
    await bus.emit(_SampleEvent("ok"))
    assert seen == ["ok"]


async def test_app_context_accepts_organization_id(
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    org_id = uuid4()
    async with app_context(organization_id=org_id) as ctx:
        assert ctx.organization_id == org_id
        assert isinstance(ctx.session, AsyncSession)


async def test_app_context_requires_configured_session_maker() -> None:
    previous = context_mod._session_maker
    try:
        context_mod._session_maker = None
        with pytest.raises(RuntimeError, match="not configured"):
            async with app_context():
                pass
    finally:
        context_mod._session_maker = previous
