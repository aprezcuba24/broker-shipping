from __future__ import annotations

import asyncio
from dataclasses import dataclass

import pytest

from app.lib.events.bus import EventBus
from app.lib.events.registry import _wrap_handler

pytestmark = pytest.mark.asyncio(loop_scope="session")


@dataclass(frozen=True)
class _SampleEvent:
    value: str


async def test_emit_calls_multiple_handlers() -> None:
    bus = EventBus()
    seen: list[str] = []

    async def first(event: _SampleEvent) -> None:
        seen.append(f"first:{event.value}")

    async def second(event: _SampleEvent) -> None:
        seen.append(f"second:{event.value}")

    bus.subscribe(_SampleEvent, first)
    bus.subscribe(_SampleEvent, second)
    await bus.emit(_SampleEvent("x"))
    assert seen == ["first:x", "second:x"]


async def test_wrapped_handler_failure_does_not_block_others() -> None:
    bus = EventBus()
    seen: list[str] = []

    async def boom(_event: _SampleEvent) -> None:
        raise RuntimeError("boom")

    async def ok(event: _SampleEvent) -> None:
        seen.append(event.value)

    bus.subscribe(_SampleEvent, _wrap_handler(boom, _SampleEvent, "boom"))
    bus.subscribe(_SampleEvent, _wrap_handler(ok, _SampleEvent, "ok"))
    await bus.emit(_SampleEvent("ok"))
    assert seen == ["ok"]


async def test_background_emit_dispatches() -> None:
    bus = EventBus()
    seen: list[str] = []
    done = asyncio.Event()

    async def handler(event: _SampleEvent) -> None:
        seen.append(event.value)
        done.set()

    bus.subscribe(_SampleEvent, handler)
    await bus.emit(_SampleEvent("bg"), background=True)
    await asyncio.wait_for(done.wait(), timeout=1.0)
    assert seen == ["bg"]
