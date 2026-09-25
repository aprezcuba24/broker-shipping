from __future__ import annotations

from collections.abc import Iterator
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.db import context as context_mod
from app.db.context import configure_session_maker
from app.models.customer.customer import Customer
from app.models.order.enums import Currency
from tests.factories.auth_helpers import bearer_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.location_factory import LocationFactory
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


async def _advance_to_delivered(
    client: AsyncClient,
    *,
    order_id: str,
    organization_id: str,
    bearer: dict[str, str],
) -> None:
    for status in ("reviewed", "sent", "delivered"):
        response = await client.patch(
            f"/orders/provider/{order_id}/items",
            params={"organization_id": organization_id},
            headers=bearer,
            json={"status": status},
        )
        assert response.status_code == 200, response.text


async def test_finishing_order_updates_purchase_tier_for_phone(
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
    other_seller_user = await user_factory.build()
    provider = await organization_factory.build(user_id=provider_user["id"])
    seller = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller["id"],
    )
    product = await product_factory.build(
        organization_id=provider["id"],
        currency=Currency.cup,
        price=1000,
    )
    shared_phone = "5355550001"
    customer = await customer_factory.build(
        seller_organization_id=seller["id"],
        phone=shared_phone,
        ci="9000000001",
    )
    same_phone_other_org = await customer_factory.build(
        seller_organization_id=other_seller["id"],
        phone=shared_phone,
        ci="9000000002",
    )
    other_phone_customer = await customer_factory.build(
        seller_organization_id=seller["id"],
        phone="5355550002",
        ci="9000000003",
    )

    create = await client.post(
        "/orders/seller/",
        params={"organization_id": seller["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
        json={
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                }
            ],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["id"]

    provider_bearer = bearer_headers(user_id=provider_user["id"])
    await _advance_to_delivered(
        client,
        order_id=order_id,
        organization_id=provider["id"],
        bearer=provider_bearer,
    )

    db_session.expire_all()
    for customer_id in (customer["id"], same_phone_other_org["id"]):
        row = await db_session.get(Customer, UUID(str(customer_id)))
        assert row is not None
        assert row.purchase_tier == 1

    other_row = await db_session.get(
        Customer,
        UUID(str(other_phone_customer["id"])),
    )
    assert other_row is not None
    assert other_row.purchase_tier == 0

    seller_order = await client.get(
        f"/orders/seller/{order_id}",
        params={"organization_id": seller["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert seller_order.status_code == 200
    assert seller_order.json()["status"] == "finished"
    assert seller_order.json()["customer"]["purchase_tier"] == 1

    provider_order = await client.get(
        f"/orders/provider/{order_id}",
        params={"organization_id": provider["id"]},
        headers=provider_bearer,
    )
    assert provider_order.status_code == 200
    assert provider_order.json()["customer"]["purchase_tier"] == 1

    customer_detail = await client.get(
        f"/customers/seller/{customer['id']}",
        params={"organization_id": seller["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert customer_detail.status_code == 200
    assert customer_detail.json()["purchase_tier"] == 1


async def test_canceled_order_does_not_raise_purchase_tier(
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
        currency=Currency.cup,
        price=1000,
    )
    customer = await customer_factory.build(
        seller_organization_id=seller["id"],
        phone="5355550010",
    )

    create = await client.post(
        "/orders/seller/",
        params={"organization_id": seller["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
        json={
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                }
            ],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["id"]

    canceled = await client.patch(
        f"/orders/provider/{order_id}/items",
        params={"organization_id": provider["id"]},
        headers=bearer_headers(user_id=provider_user["id"]),
        json={"status": "canceled"},
    )
    assert canceled.status_code == 200
    assert canceled.json()["status"] == "canceled"

    db_session.expire_all()
    row = await db_session.get(Customer, UUID(str(customer["id"])))
    assert row is not None
    assert row.purchase_tier == 0


async def test_new_customer_inherits_existing_phone_tier(
    client: AsyncClient,
    db_session: AsyncSession,
    configured_session_maker: async_sessionmaker[AsyncSession],
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    location_factory: LocationFactory,
) -> None:
    _ = configured_session_maker
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()
    provider = await organization_factory.build(user_id=provider_user["id"])
    seller = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller["id"],
    )
    product = await product_factory.build(
        organization_id=provider["id"],
        currency=Currency.cup,
        price=1000,
    )
    shared_phone = "5355550020"
    customer = await customer_factory.build(
        seller_organization_id=seller["id"],
        phone=shared_phone,
        ci="9000000020",
    )
    create = await client.post(
        "/orders/seller/",
        params={"organization_id": seller["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
        json={
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                }
            ],
        },
    )
    assert create.status_code == 201
    await _advance_to_delivered(
        client,
        order_id=create.json()["id"],
        organization_id=provider["id"],
        bearer=bearer_headers(user_id=provider_user["id"]),
    )

    province = await location_factory.build_province(name="Habana Tier")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Plaza Tier",
    )
    created = await client.post(
        "/customers/seller/",
        params={"organization_id": other_seller["id"]},
        headers=bearer_headers(user_id=other_seller_user["id"]),
        json={
            "name": "Otro Vendedor",
            "ci": "9000000021",
            "phone": shared_phone,
            "address": {
                "address": "Calle Tier 1",
                "province_id": province["id"],
                "municipality_id": municipality["id"],
            },
        },
    )
    assert created.status_code == 201
    assert created.json()["purchase_tier"] == 1
