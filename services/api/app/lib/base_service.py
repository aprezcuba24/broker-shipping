from collections.abc import Sequence
from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlmodel import SQLModel

from app.lib.event_base import Event
from app.lib.event_dispatcher import EventDispatcher
from app.lib.post_commit import PostCommitQueue
from app.lib.resource import Resource

T = TypeVar("T", bound=SQLModel)


class BaseService(Generic[T]):
    """Generic service with standard CRUD that delegates to a :class:`Resource`.

    Subclass with the concrete model::

        class OrganizationService(BaseService[Organization]):
            pass  # inherits all CRUD, no hooks needed

    Override the ``on_*`` hooks to react to operations (e.g. emit events)::

        class ProductService(BaseService[Product]):
            async def on_create(self, entity: Product) -> None:
                self.post_commit_emit(ProductCreated(entity=entity))

    ``dispatcher`` and ``post_commit`` are injected automatically by
    ``make_service_depends(..., with_events=True)``.
    """

    def __init__(
        self,
        repository: Resource[T],
        dispatcher: EventDispatcher | None = None,
        post_commit: PostCommitQueue | None = None,
    ) -> None:
        self._repo = repository
        self._dispatcher = dispatcher
        self._post_commit = post_commit

    def post_commit_emit(self, event: Event) -> None:
        """Enqueue ``dispatcher.emit(event)`` to run after the DB commit succeeds."""
        dispatcher, post_commit = self._dispatcher, self._post_commit
        assert dispatcher is not None and post_commit is not None, (
            f"{type(self).__name__} requires make_service_depends(..., with_events=True)"
        )
        post_commit.enqueue(lambda: dispatcher.emit(event))

    # ── CRUD ────────────────────────────────────────────────

    async def list(self) -> Sequence[T]:
        entities = await self._repo.list_all()
        await self.on_list(entities)
        return entities

    async def get(self, entity_id: UUID) -> T | None:
        entity = await self._repo.get_by_id(entity_id)
        await self.on_get(entity)
        return entity

    async def create(self, entity: T) -> T:
        entity = await self._repo.create(entity)
        await self.on_create(entity)
        return entity

    async def update(self, entity_id: UUID, data: dict[str, Any]) -> T | None:
        entity = await self._repo.get_by_id(entity_id)
        if entity is None:
            return None
        entity = await self._repo.update(entity, data)
        await self.on_update(entity)
        return entity

    async def delete(self, entity_id: UUID) -> bool:
        entity = await self._repo.get_by_id(entity_id)
        if entity is None:
            return False
        await self._repo.delete(entity)
        await self.on_delete(entity)
        return True

    # ── Hooks (override in subclass) ────────────────────────

    async def on_list(self, entities: Sequence[T]) -> None:
        pass

    async def on_get(self, entity: T | None) -> None:
        pass

    async def on_create(self, entity: T) -> None:
        pass

    async def on_update(self, entity: T) -> None:
        pass

    async def on_delete(self, entity: T) -> None:
        pass
