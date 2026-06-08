import logging
from collections import defaultdict
from collections.abc import Awaitable, Callable, Iterator
from typing import TypeVar, cast

from dishka import AsyncContainer
from dishka.integrations.base import wrap_injection

from app.lib.event_base import Event

logger = logging.getLogger(__name__)

E = TypeVar("E", bound=Event)
H = TypeVar("H")
Handler = Callable[[Event], Awaitable[None]]
GateHandler = Callable[[Event], Awaitable[bool]]


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
        self._gate_handlers: dict[type[Event], list[GateHandler]] = defaultdict(list)
        self._container: AsyncContainer | None = None

    def bind_container(self, container: AsyncContainer) -> None:
        """Bind the APP-scope container used to open a fresh REQUEST scope per handler."""
        self._container = container

    def _inject_and_append(
        self,
        event_type: type[E],
        handler: Callable[[E], Awaitable[object]],
        registry: dict[type[Event], list[H]],
        *,
        subscribe_method: str,
    ) -> None:
        if self._container is None:
            raise RuntimeError(
                f"EventDispatcher.bind_container() must be called before "
                f"{subscribe_method}(). "
                "Register listeners inside the application lifespan, after container setup."
            )
        wrapped = wrap_injection(
            func=handler,
            container_getter=lambda args, kwargs: self._container,
            is_async=True,
            manage_scope=True,
        )
        registry[event_type].append(cast(H, wrapped))

    def subscribe(
        self,
        event_type: type[E],
        handler: Callable[[E], Awaitable[None]],
    ) -> None:
        self._inject_and_append(
            event_type, handler, self._handlers, subscribe_method="subscribe"
        )

    def subscribe_gate(
        self,
        event_type: type[E],
        handler: Callable[[E], Awaitable[bool]],
    ) -> None:
        self._inject_and_append(
            event_type, handler, self._gate_handlers, subscribe_method="subscribe_gate"
        )

    def _iter_handlers(
        self,
        event: Event,
        registry: dict[type[Event], list[H]],
    ) -> Iterator[H]:
        seen: set[int] = set()
        for cls in type(event).mro():
            if cls is object or not issubclass(cls, Event):
                continue
            for handler in registry.get(cls, ()):
                hid = id(handler)
                if hid in seen:
                    continue
                seen.add(hid)
                yield handler

    async def emit_gate(self, event: Event) -> bool:
        """Run gate handlers; return False if any handler returns False or raises."""
        for handler in self._iter_handlers(event, self._gate_handlers):
            try:
                allowed = await handler(event)
                if not allowed:
                    return False
            except Exception:
                logger.exception(
                    "Gate handler failed for event %s",
                    type(event).__name__,
                )
                return False
        return True

    async def emit(self, event: Event) -> None:
        for handler in self._iter_handlers(event, self._handlers):
            try:
                await handler(event)
            except Exception:
                logger.exception(
                    "Handler failed for event %s",
                    type(event).__name__,
                )
