from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @staticmethod
    def pages_count(total: int, page_size: int) -> int:
        if total <= 0:
            return 0
        return (total + page_size - 1) // page_size


@dataclass(frozen=True, slots=True)
class PageResult(Generic[T]):
    """Service-layer page — not coupled to the HTTP response shape."""

    items: list[T]
    total: int


class Page(BaseModel, Generic[T]):
    """HTTP response envelope for paginated list endpoints."""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def from_result(
        cls,
        result: PageResult[T],
        params: PaginationParams,
    ) -> Page[T]:
        return cls(
            items=result.items,
            total=result.total,
            page=params.page,
            page_size=params.page_size,
            pages=PaginationParams.pages_count(result.total, params.page_size),
        )

    @classmethod
    def from_mapped(
        cls,
        result: PageResult[Any],
        params: PaginationParams,
        mapper: Callable[[Any], T],
    ) -> Page[T]:
        return cls.from_result(
            PageResult(items=[mapper(item) for item in result.items], total=result.total),
            params,
        )
