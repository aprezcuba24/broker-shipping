from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import TypeVar, cast

from app.lib.event_base import Event

E = TypeVar("E", bound=Event)
Handler = Callable[[Event], Awaitable[None]]


class EventDispatcher:
    """In-process async bus: subscribe by event class, emit model instances.

    Handlers registered on a base :class:`Event` type run for subclass instances
    (MRO order, each handler at most once per emit).
    """

    def __init__(self) -> None:
        self._handlers: dict[type[Event], list[Handler]] = defaultdict(list)

    def subscribe(
        self,
        event_type: type[E],
        handler: Callable[[E], Awaitable[None]],
    ) -> None:
        self._handlers[event_type].append(cast(Handler, handler))

    async def emit(self, event: Event) -> None:
        seen: set[int] = set()
        for cls in type(event).mro():
            if cls is object or not issubclass(cls, Event):
                continue
            for handler in self._handlers.get(cls, ()):
                hid = id(handler)
                if hid in seen:
                    continue
                seen.add(hid)
                await handler(event)
