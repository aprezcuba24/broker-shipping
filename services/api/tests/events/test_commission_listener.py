from __future__ import annotations

from collections.abc import Iterator
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.db import context as context_mod
from app.db.context import configure_session_maker
from app.events.types import OrderItemDeliveredEvent
from app.lib.events import emit
from app.models.commission.commission import Commission
from app.models.order.enums import Currency, OrderItemStatus
from app.models.order.order_item import OrderItem
from tests.factories.auth_helpers import bearer_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture
def configured_session_maker(
    test_engine: AsyncEngine,
) -> Iterator[async_sessionmaker[AsyncSession]]:
    previous = context_mod._session_maker
    session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    configure_session_maker(session_maker)
    try:
        yield session_maker
    finally:
        context_mod._session_maker = previous


async def test_order_item_delivered_event_creates_commission(
    client: AsyncClient,
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> None:
    _ = configured_session_maker
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider = await organization_factory.build(user_id=provider_user["id"])
    seller = await organization_factory.build_seller(user_id=seller_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller["id"],
    )
    product = await product_factory.build(
        organization_id=provider["id"],
        commission=125,
        currency=Currency.cup,
        price=1000,
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
                    "quantity": 4,
                    "seller_provider_price": 1000,
                }
            ],
        },
    )
    assert create.status_code == 201
    item_id = UUID(create.json()["items"][0]["id"])

    item = await db_session.get(OrderItem, item_id)
    assert item is not None
    item.status = OrderItemStatus.delivered
    db_session.add(item)
    await db_session.commit()

    await emit(OrderItemDeliveredEvent(order_item_id=item_id), background=False)

    db_session.expire_all()
    result = await db_session.execute(
        select(Commission).where(Commission.order_id == UUID(create.json()["id"]))
    )
    commissions = list(result.scalars().all())
    assert len(commissions) == 1
    assert commissions[0].amount == 500  # 125 * 4
    item = await db_session.get(OrderItem, item_id)
    assert item is not None
    assert item.commission_id == commissions[0].id
