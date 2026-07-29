from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any, TypeVar

from app.db.inject import inject_app_context
from app.lib.events.bus import EventBus, EventHandler

logger = logging.getLogger(__name__)

T = TypeVar("T")

_pending: list[tuple[type, EventHandler[Any], str]] = []
_registered = False


def listener(
    event_type: type[T],
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        wrapped: EventHandler[T] = inject_app_context(fn)
        _pending.append((event_type, wrapped, fn.__name__))
        return fn

    return decorator


def _wrap_handler(
    fn: EventHandler[T],
    event_type: type[T],
    name: str,
) -> EventHandler[T]:
    async def safe_handler(event: T) -> None:
        try:
            await fn(event)
        except Exception:
            logger.exception(
                "Event listener %s failed for %s",
                name,
                event_type.__name__,
            )

    return safe_handler


def register_handlers(bus: EventBus) -> None:
    global _registered
    import app.events.handlers  # noqa: F401

    if _registered:
        return
    for event_type, fn, name in _pending:
        bus.subscribe(event_type, _wrap_handler(fn, event_type, name))
    _registered = True
