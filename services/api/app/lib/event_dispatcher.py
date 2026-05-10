from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any


Handler = Callable[..., Awaitable[None]]


class EventDispatcher:
    """In-process async event bus: subscribe handlers by event name, emit with keyword payload."""

    def __init__(self) -> None:
        self._handlers: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, event: str, handler: Handler) -> None:
        self._handlers[event].append(handler)

    async def emit(self, event: str, **payload: Any) -> None:
        for handler in self._handlers.get(event, []):
            await handler(**payload)
