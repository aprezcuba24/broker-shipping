from collections.abc import Sequence
from typing import Any, Generic, TypeVar, get_args
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

T = TypeVar("T", bound=SQLModel)


class Resource(Generic[T]):
    """Generic async repository with standard CRUD operations.

    Subclass with the concrete SQLModel table class::

        class ProductRepository(Resource[Product]): ...

    The model class is extracted automatically from the generic parameter;
    all methods are typed with ``T`` so the IDE resolves the concrete model.
    """

    _model: type[T]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        for base in getattr(cls, "__orig_bases__", ()):
            args = get_args(base)
            if args and isinstance(args[0], type) and issubclass(args[0], SQLModel):
                cls._model = args[0]
                break

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> Sequence[T]:
        result = await self._session.execute(select(self._model))
        return result.scalars().all()

    async def get_by_id(self, entity_id: UUID) -> T | None:
        result = await self._session.execute(
            select(self._model).where(self._model.id == entity_id)  # type: ignore[attr-defined]
        )
        return result.scalar_one_or_none()

    async def create(self, entity: T) -> T:
        self._session.add(entity)
        await self._session.flush()
        return entity

    async def update(self, entity: T, data: dict[str, Any]) -> T:
        for key, value in data.items():
            setattr(entity, key, value)
        await self._session.flush()
        return entity

    async def delete(self, entity: T) -> None:
        await self._session.delete(entity)
        await self._session.flush()
