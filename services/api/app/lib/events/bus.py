from __future__ import annotations

import asyncio
from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

T = TypeVar("T")
EventHandler = Callable[[T], Awaitable[None]]


class EventBus:
    def __init__(self) -> None:
        self._handlers: dict[type, list[EventHandler[Any]]] = defaultdict(list)

    def subscribe(self, event_type: type[T], handler: EventHandler[T]) -> None:
        self._handlers[event_type].append(handler)

    async def emit(self, event: T, *, background: bool = False) -> None:
        if background:
            asyncio.create_task(self._dispatch(event))
            return
        await self._dispatch(event)

    async def _dispatch(self, event: T) -> None:
        handlers = self._handlers.get(type(event), [])
        for handler in handlers:
            await handler(event)


_bus = EventBus()


def get_bus() -> EventBus:
    return _bus
