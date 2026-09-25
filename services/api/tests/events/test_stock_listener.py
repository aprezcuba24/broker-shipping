from __future__ import annotations

from collections.abc import Iterator
from uuid import UUID

import pytest
from app.lib.exceptions import ApiError
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.db import context as context_mod
from app.db.context import configure_session_maker
from app.events.types import (
    OrderCreatedEvent,
    OrderItemCanceledEvent,
    OrderItemConsumedEvent,
)
from app.lib.events import emit
from app.models.order.enums import Currency, OrderItemStatus
from app.models.order.order_item import OrderItem
from app.models.product.product import Product
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


@pytest.fixture
async def stock_listener_ctx(
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
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
    product = await product_factory.build(
        organization_id=provider["id"],
        name="Arroz",
        currency=Currency.cup,
        commission=100,
        price=800,
        stock=10,
    )
    customer = await customer_factory.build(seller_organization_id=seller["id"])
    return {
        "provider_user_id": provider_user["id"],
        "seller_user_id": seller_user["id"],
        "provider_org_id": provider["id"],
        "seller_org_id": seller["id"],
        "product_id": product["id"],
        "customer_id": customer["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "seller_params": {"organization_id": seller["id"]},
    }


async def _create_order(client: AsyncClient, ctx: dict, quantity: int = 3) -> dict:
    r = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_bearer"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [
                {
                    "product_id": ctx["product_id"],
                    "quantity": quantity,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r.status_code == 201
    return r.json()


async def test_order_created_event_reserves_stock(
    client: AsyncClient,
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
    stock_listener_ctx: dict,
) -> None:
    _ = client
    _ = configured_session_maker
    product_id = UUID(stock_listener_ctx["product_id"])
    product = await db_session.get(Product, product_id)
    assert product is not None
    assert product.stock == 10
    assert product.reserved == 0

    order = await _create_order(client, stock_listener_ctx, quantity=4)
    db_session.expire_all()
    product = await db_session.get(Product, product_id)
    assert product is not None
    assert product.stock == 6
    assert product.reserved == 4
    assert order["id"]


async def test_order_created_event_insufficient_stock_is_409(
    client: AsyncClient,
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
    stock_listener_ctx: dict,
) -> None:
    _ = configured_session_maker
    r = await client.post(
        "/orders/seller/",
        params=stock_listener_ctx["seller_params"],
        headers=stock_listener_ctx["seller_bearer"],
        json={
            "customer_id": stock_listener_ctx["customer_id"],
            "items": [
                {
                    "product_id": stock_listener_ctx["product_id"],
                    "quantity": 11,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r.status_code == 409
    body = r.json()
    assert body["code"] == "insufficient_stock"
    assert body["params"]["available"] == 10
    assert body["params"]["requested"] == 11
    db_session.expire_all()
    product = await db_session.get(Product, UUID(stock_listener_ctx["product_id"]))
    assert product is not None
    assert product.stock == 10
    assert product.reserved == 0


async def test_emit_order_item_canceled_releases_stock(
    client: AsyncClient,
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
    stock_listener_ctx: dict,
) -> None:
    _ = configured_session_maker
    order = await _create_order(client, stock_listener_ctx, quantity=3)
    item_id = UUID(order["items"][0]["id"])
    product_id = UUID(stock_listener_ctx["product_id"])

    async with configured_session_maker() as session:
        await emit(
            OrderItemCanceledEvent(order_item_id=item_id),
            session=session,
            propagate_errors=True,
        )
        await session.commit()

    db_session.expire_all()
    product = await db_session.get(Product, product_id)
    assert product is not None
    assert product.stock == 10
    assert product.reserved == 0


async def test_emit_order_item_consumed_clears_reserved(
    client: AsyncClient,
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
    stock_listener_ctx: dict,
) -> None:
    _ = configured_session_maker
    order = await _create_order(client, stock_listener_ctx, quantity=3)
    item_id = UUID(order["items"][0]["id"])
    product_id = UUID(stock_listener_ctx["product_id"])

    async with configured_session_maker() as session:
        item = await session.get(OrderItem, item_id)
        assert item is not None
        item.status = OrderItemStatus.delivered
        session.add(item)
        await session.flush()
        await emit(
            OrderItemConsumedEvent(order_item_id=item_id),
            session=session,
            propagate_errors=True,
        )
        await session.commit()

    db_session.expire_all()
    product = await db_session.get(Product, product_id)
    assert product is not None
    assert product.stock == 7
    assert product.reserved == 0


async def test_emit_order_created_with_missing_order_is_404(
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    _ = configured_session_maker
    from uuid import uuid4

    async with configured_session_maker() as session:
        with pytest.raises(ApiError) as exc:
            await emit(
                OrderCreatedEvent(order_id=uuid4()),
                session=session,
                propagate_errors=True,
            )
        assert exc.value.status_code == 404
        assert exc.value.code == "not_found"
