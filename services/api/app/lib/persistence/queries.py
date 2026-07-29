from __future__ import annotations

from typing import Any, Literal, TypeVar, overload

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, select

T = TypeVar("T", bound=SQLModel)


@overload
async def get_entity(
    session: AsyncSession,
    model: type[T],
    *,
    required: Literal[True] = ...,
    not_found_detail: str = ...,
    **filters: Any,
) -> T: ...


@overload
async def get_entity(
    session: AsyncSession,
    model: type[T],
    *,
    required: Literal[False],
    not_found_detail: str = ...,
    **filters: Any,
) -> T | None: ...


async def get_entity(
    session: AsyncSession,
    model: type[T],
    *,
    required: bool = True,
    not_found_detail: str = "Not found",
    **filters: Any,
) -> T | None:
    """Load a single row by equality filters; optionally raise 404 if missing."""
    if not filters:
        raise ValueError("get_entity requires at least one filter")

    conditions = []
    for name, value in filters.items():
        column = getattr(model, name, None)
        if column is None:
            raise AttributeError(f"{model.__name__} has no attribute {name!r}")
        conditions.append(column == value)

    result = await session.execute(select(model).where(*conditions))
    entity = result.scalar_one_or_none()
    if entity is None and required:
        raise HTTPException(status_code=404, detail=not_found_detail)
    return entity
