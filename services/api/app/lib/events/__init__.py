from __future__ import annotations

from typing import TypeVar

from app.lib.events.bus import EventBus, get_bus

T = TypeVar("T")

__all__ = [
    "EventBus",
    "emit",
    "get_bus",
]


async def emit(event: T, *, background: bool = False) -> None:
    await get_bus().emit(event, background=background)
