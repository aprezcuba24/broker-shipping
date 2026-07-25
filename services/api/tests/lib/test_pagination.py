from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence.pagination import paginate
from app.models.product.product import Product
from app.schemas.pagination import Page, PageResult, PaginationParams
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory


def test_pages_count_edge_cases() -> None:
    assert PaginationParams.pages_count(0, 20) == 0
    assert PaginationParams.pages_count(-1, 20) == 0
    assert PaginationParams.pages_count(1, 20) == 1
    assert PaginationParams.pages_count(20, 20) == 1
    assert PaginationParams.pages_count(21, 20) == 2
    assert PaginationParams.pages_count(5, 2) == 3


def test_pagination_params_offset() -> None:
    assert PaginationParams(page=1, page_size=20).offset == 0
    assert PaginationParams(page=2, page_size=20).offset == 20
    assert PaginationParams(page=3, page_size=10).offset == 20


def test_page_from_result_and_mapped() -> None:
    params = PaginationParams(page=1, page_size=2)
    result = PageResult(items=["a", "b"], total=5)
    page = Page.from_result(result, params)
    assert page.items == ["a", "b"]
    assert page.total == 5
    assert page.page == 1
    assert page.page_size == 2
    assert page.pages == 3

    mapped = Page.from_mapped(
        PageResult(items=[1, 2], total=2),
        params,
        mapper=str,
    )
    assert mapped.items == ["1", "2"]
    assert mapped.pages == 1


@pytest.mark.asyncio(loop_scope="session")
async def test_paginate_slices_and_counts(
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    for name in ("Alpha", "Bravo", "Charlie", "Delta"):
        await product_factory.build(organization_id=org["id"], name=name)

    stmt = (
        select(Product)
        .where(Product.organization_id == org["id"])
        .order_by(Product.name)
    )

    page1 = await paginate(
        db_session,
        stmt,
        PaginationParams(page=1, page_size=2),
    )
    assert page1.total == 4
    assert [p.name for p in page1.items] == ["Alpha", "Bravo"]

    page2 = await paginate(
        db_session,
        stmt,
        PaginationParams(page=2, page_size=2),
    )
    assert page2.total == 4
    assert [p.name for p in page2.items] == ["Charlie", "Delta"]

    empty = await paginate(
        db_session,
        stmt,
        PaginationParams(page=10, page_size=2),
    )
    assert empty.total == 4
    assert empty.items == []


@pytest.mark.asyncio(loop_scope="session")
async def test_paginate_respects_filters(
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    await product_factory.build(organization_id=org["id"], name="Laptop")
    await product_factory.build(organization_id=org["id"], name="Desktop")
    await product_factory.build(organization_id=org["id"], name="Laptop Pro")

    stmt = (
        select(Product)
        .where(
            Product.organization_id == org["id"],
            col(Product.name).ilike("%laptop%"),
        )
        .order_by(Product.name)
    )
    result = await paginate(
        db_session,
        stmt,
        PaginationParams(page=1, page_size=10),
    )
    assert result.total == 2
    assert [p.name for p in result.items] == ["Laptop", "Laptop Pro"]
