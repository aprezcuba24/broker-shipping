from __future__ import annotations

from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.commission.commission import Commission
from app.models.order.enums import Currency, OrderItemStatus
from app.models.order.order_item import OrderItem
from app.services.commission import assign as assign_service
from app.services.commission import provider as provider_commission_service
from tests.factories.auth_helpers import bearer_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _create_linked_order(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    *,
    products: list[dict],
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider = await organization_factory.build(user_id=provider_user["id"])
    seller = await organization_factory.build_seller(user_id=seller_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller["id"],
    )

    created_products = []
    for spec in products:
        created_products.append(
            await product_factory.build(
                organization_id=provider["id"],
                name=spec["name"],
                currency=spec.get("currency", Currency.cup),
                commission=spec["commission"],
                price=spec.get("price", 1000),
            )
        )

    customer = await customer_factory.build(seller_organization_id=seller["id"])
    create = await client.post(
        "/orders/seller/",
        params={"organization_id": seller["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
        json={
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": products[i].get("quantity", 1),
                    "seller_provider_price": products[i].get("price", 1000),
                }
                for i, product in enumerate(created_products)
            ],
        },
    )
    assert create.status_code == 201, create.text
    order = create.json()
    return {
        "provider_id": provider["id"],
        "seller_id": seller["id"],
        "provider_user_id": provider_user["id"],
        "seller_user_id": seller_user["id"],
        "order_id": order["id"],
        "items": order["items"],
        "products": created_products,
    }


async def _mark_item_delivered(
    db_session: AsyncSession,
    item_id: UUID,
) -> OrderItem:
    item = await db_session.get(OrderItem, item_id)
    assert item is not None
    item.status = OrderItemStatus.delivered
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item


async def test_assign_creates_commission_for_first_delivered_item(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _create_linked_order(
        client,
        db_session,
        user_factory,
        organization_factory,
        product_factory,
        customer_factory,
        products=[{"name": "P1", "commission": 150, "quantity": 2}],
    )
    item_id = UUID(ctx["items"][0]["id"])
    await _mark_item_delivered(db_session, item_id)

    commission = await assign_service.assign_delivered_item(db_session, item_id)
    assert commission is not None
    assert commission.amount == 300  # 150 * 2
    assert commission.currency == Currency.cup
    assert commission.is_paid is False
    assert str(commission.provider_organization_id) == ctx["provider_id"]
    assert str(commission.seller_organization_id) == ctx["seller_id"]

    item = await db_session.get(OrderItem, item_id)
    assert item is not None
    assert item.commission_id == commission.id


async def test_assign_accumulates_same_order_provider_currency(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _create_linked_order(
        client,
        db_session,
        user_factory,
        organization_factory,
        product_factory,
        customer_factory,
        products=[
            {"name": "P1", "commission": 100, "quantity": 1},
            {"name": "P2", "commission": 50, "quantity": 3},
        ],
    )
    item_a = UUID(ctx["items"][0]["id"])
    item_b = UUID(ctx["items"][1]["id"])
    await _mark_item_delivered(db_session, item_a)
    await _mark_item_delivered(db_session, item_b)

    c1 = await assign_service.assign_delivered_item(db_session, item_a)
    assert c1 is not None
    assert c1.amount == 100

    c2 = await assign_service.assign_delivered_item(db_session, item_b)
    assert c2 is not None
    assert c2.id == c1.id
    assert c2.amount == 250  # 100 + 50*3

    result = await db_session.execute(
        select(Commission).where(Commission.order_id == UUID(ctx["order_id"]))
    )
    assert len(list(result.scalars().all())) == 1


async def test_assign_separates_by_currency(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _create_linked_order(
        client,
        db_session,
        user_factory,
        organization_factory,
        product_factory,
        customer_factory,
        products=[
            {"name": "CUP", "commission": 100, "currency": Currency.cup, "quantity": 1},
            {
                "name": "USD",
                "commission": 200,
                "currency": Currency.usd,
                "quantity": 1,
                "price": 2000,
            },
        ],
    )
    item_cup = UUID(ctx["items"][0]["id"])
    item_usd = UUID(ctx["items"][1]["id"])
    await _mark_item_delivered(db_session, item_cup)
    await _mark_item_delivered(db_session, item_usd)

    c_cup = await assign_service.assign_delivered_item(db_session, item_cup)
    c_usd = await assign_service.assign_delivered_item(db_session, item_usd)
    assert c_cup is not None and c_usd is not None
    assert c_cup.id != c_usd.id
    assert c_cup.currency == Currency.cup
    assert c_usd.currency == Currency.usd
    assert c_cup.amount == 100
    assert c_usd.amount == 200


async def test_assign_creates_new_commission_after_paid(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _create_linked_order(
        client,
        db_session,
        user_factory,
        organization_factory,
        product_factory,
        customer_factory,
        products=[
            {"name": "P1", "commission": 100, "quantity": 1},
            {"name": "P2", "commission": 75, "quantity": 1},
        ],
    )
    item_a = UUID(ctx["items"][0]["id"])
    item_b = UUID(ctx["items"][1]["id"])
    await _mark_item_delivered(db_session, item_a)

    first = await assign_service.assign_delivered_item(db_session, item_a)
    assert first is not None
    paid = await provider_commission_service.mark_commission_paid(
        db_session,
        first.id,
        UUID(ctx["provider_id"]),
    )
    assert paid.is_paid is True

    await _mark_item_delivered(db_session, item_b)
    second = await assign_service.assign_delivered_item(db_session, item_b)
    assert second is not None
    assert second.id != first.id
    assert second.is_paid is False
    assert second.amount == 75


async def test_assign_is_idempotent(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _create_linked_order(
        client,
        db_session,
        user_factory,
        organization_factory,
        product_factory,
        customer_factory,
        products=[{"name": "P1", "commission": 100, "quantity": 2}],
    )
    item_id = UUID(ctx["items"][0]["id"])
    await _mark_item_delivered(db_session, item_id)

    first = await assign_service.assign_delivered_item(db_session, item_id)
    second = await assign_service.assign_delivered_item(db_session, item_id)
    assert first is not None and second is not None
    assert first.id == second.id
    assert second.amount == 200
