from __future__ import annotations

import asyncio
from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.events.emit_context import reset_emit_context, set_emit_context

T = TypeVar("T")
EventHandler = Callable[[T], Awaitable[None]]


class EventBus:
    def __init__(self) -> None:
        self._handlers: dict[type, list[EventHandler[Any]]] = defaultdict(list)

    def subscribe(self, event_type: type[T], handler: EventHandler[T]) -> None:
        self._handlers[event_type].append(handler)

    async def emit(
        self,
        event: T,
        *,
        background: bool = False,
        session: AsyncSession | None = None,
        propagate_errors: bool = False,
    ) -> None:
        if background:
            asyncio.create_task(
                self._dispatch(
                    event,
                    session=session,
                    propagate_errors=propagate_errors,
                )
            )
            return
        await self._dispatch(
            event,
            session=session,
            propagate_errors=propagate_errors,
        )

    async def _dispatch(
        self,
        event: T,
        *,
        session: AsyncSession | None = None,
        propagate_errors: bool = False,
    ) -> None:
        tokens = set_emit_context(
            session=session,
            propagate_errors=propagate_errors,
        )
        try:
            handlers = self._handlers.get(type(event), [])
            for handler in handlers:
                await handler(event)
        finally:
            reset_emit_context(tokens)


_bus = EventBus()


def get_bus() -> EventBus:
    return _bus
