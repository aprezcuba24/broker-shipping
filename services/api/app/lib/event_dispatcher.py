import logging
from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import TypeVar, cast

from dishka import AsyncContainer
from dishka.integrations.base import wrap_injection

from app.lib.event_base import Event

logger = logging.getLogger(__name__)

E = TypeVar("E", bound=Event)
Handler = Callable[[Event], Awaitable[None]]


class EventDispatcher:
    """In-process async bus: subscribe by event class, emit model instances.

    Handlers registered on a base :class:`Event` type run for subclass instances
    (MRO order, each handler at most once per emit).

    Each handler is wrapped via :func:`dishka.integrations.base.wrap_injection`
    so that ``FromDishka``-annotated parameters are resolved from a **fresh
    REQUEST scope** opened on the APP container.  This guarantees that every
    listener gets its own :class:`AsyncSession` and :class:`PostCommitQueue`,
    independent from the request that triggered the event.

    Call :meth:`bind_container` once (during application startup, after the
    container is created) before any :meth:`subscribe` call.
    """

    def __init__(self) -> None:
        self._handlers: dict[type[Event], list[Handler]] = defaultdict(list)
        self._container: AsyncContainer | None = None

    def bind_container(self, container: AsyncContainer) -> None:
        """Bind the APP-scope container used to open a fresh REQUEST scope per handler."""
        self._container = container

    def subscribe(
        self,
        event_type: type[E],
        handler: Callable[[E], Awaitable[None]],
    ) -> None:
        if self._container is None:
            raise RuntimeError(
                "EventDispatcher.bind_container() must be called before subscribe(). "
                "Register listeners inside the application lifespan, after container setup."
            )
        wrapped = wrap_injection(
            func=handler,
            container_getter=lambda args, kwargs: self._container,
            is_async=True,
            manage_scope=True,
        )
        self._handlers[event_type].append(cast(Handler, wrapped))

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
                try:
                    await handler(event)
                except Exception:
                    logger.exception(
                        "Handler failed for event %s",
                        type(event).__name__,
                    )
