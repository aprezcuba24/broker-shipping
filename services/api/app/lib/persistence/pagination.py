from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends, Query
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.pagination import (
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    PageResult,
    PaginationParams,
)


def get_pagination(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


PaginationDep = Annotated[PaginationParams, Depends(get_pagination)]


async def paginate(
    session: AsyncSession,
    stmt: Select[Any],
    params: PaginationParams,
) -> PageResult[Any]:
    """Run COUNT + OFFSET/LIMIT for a filtered select statement.

    The caller builds ``stmt`` with filters and optional ``order_by``.
    Order/limit/offset on the count path are stripped via subquery.
    """
    count_stmt = select(func.count()).select_from(
        stmt.order_by(None).offset(None).limit(None).subquery()
    )
    total = int((await session.execute(count_stmt)).scalar_one())

    page_stmt = stmt.offset(params.offset).limit(params.page_size)
    rows = list((await session.execute(page_stmt)).scalars().all())
    return PageResult(items=rows, total=total)
