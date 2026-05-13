import logging
from collections.abc import Awaitable, Callable

logger = logging.getLogger(__name__)


class PostCommitQueue:
    """Collects async callbacks that run only after a successful DB commit.

    Services enqueue work (typically ``dispatcher.emit(event)``) during the
    request.  The session provider in :mod:`app.lib.providers` drains the
    queue after ``commit()`` succeeds, or discards it on rollback.
    """

    def __init__(self) -> None:
        self._callbacks: list[Callable[[], Awaitable[None]]] = []

    def enqueue(self, callback: Callable[[], Awaitable[None]]) -> None:
        self._callbacks.append(callback)

    async def drain(self) -> None:
        callbacks, self._callbacks = self._callbacks, []
        for cb in callbacks:
            try:
                await cb()
            except Exception:
                logger.exception("post-commit callback failed")

    def discard(self) -> None:
        self._callbacks.clear()
