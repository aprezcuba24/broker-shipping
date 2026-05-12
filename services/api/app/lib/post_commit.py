import logging
from collections.abc import Awaitable, Callable

from fastapi import Request

logger = logging.getLogger(__name__)


class PostCommitQueue:
    """Collects async callbacks that run only after a successful DB commit.

    Services enqueue work (typically ``dispatcher.emit(event)``) during the
    request.  The session dependency drains the queue after ``commit()``
    succeeds, or discards it on rollback.
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


def get_or_init_post_commit_queue(request: Request) -> PostCommitQueue:
    """Return the per-request queue, creating it on first access."""
    if not hasattr(request.state, "post_commit_queue"):
        request.state.post_commit_queue = PostCommitQueue()
    return request.state.post_commit_queue
