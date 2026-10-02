from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select

from app.models.order.enums import Currency, OrderStatus
from app.models.order.order import Order
from app.models.order.share_conversion import OrderShareConversion
from app.models.product.enums import ShareChannel
from app.services.order import share_conversion as share_conversion_service
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


@pytest_asyncio.fixture
async def share_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    location_factory: LocationFactory,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()

    provider_a = await organization_factory.build(
        user_id=provider_user["id"],
        name="Share Provider A",
    )
    provider_b = await organization_factory.build(
        user_id=provider_user["id"],
        name="Share Provider B",
    )
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_a["id"],
        seller_organization_id=seller_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_b["id"],
        seller_organization_id=seller_org["id"],
    )

    product_a = await product_factory.build(
        organization_id=provider_a["id"],
        name="Arroz",
        public_code="4F2K",
        currency=Currency.cup,
        commission=100,
        price=800,
    )
    product_b = await product_factory.build(
        organization_id=provider_b["id"],
        name="Aceite",
        public_code="B7QX",
        currency=Currency.cup,
        commission=50,
        price=500,
    )
    product_c = await product_factory.build(
        organization_id=provider_a["id"],
        name="Leche",
        public_code="C3MN",
        currency=Currency.cup,
        commission=40,
        price=400,
    )

    province = await location_factory.build_province(name="La Habana Share")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Plaza Share",
    )
    neighborhood = await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Vedado Share",
    )
    customer = await customer_factory.build(
        seller_organization_id=seller_org["id"],
        name="Cliente Share",
        province_id=province["id"],
        municipality_id=municipality["id"],
        neighborhood_id=neighborhood["id"],
    )

    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "provider_user_id": provider_user["id"],
        "provider_a_id": provider_a["id"],
        "provider_b_id": provider_b["id"],
        "product_a_id": product_a["id"],
        "product_a_code": product_a["public_code"],
        "product_b_id": product_b["id"],
        "product_b_code": product_b["public_code"],
        "product_c_id": product_c["id"],
        "product_c_code": product_c["public_code"],
        "customer_id": customer["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "provider_a_params": {"organization_id": provider_a["id"]},
        "provider_b_params": {"organization_id": provider_b["id"]},
    }


async def _create_order(
    client: AsyncClient,
    ctx: dict,
    items: list[dict],
) -> dict:
    response = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_bearer"],
        json={
            "customer_id": ctx["customer_id"],
            "items": items,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _deliver_provider_items(
    client: AsyncClient,
    *,
    order_id: str,
    provider_params: dict,
    provider_bearer: dict,
) -> None:
    for status in ("reviewed", "sent", "delivered"):
        response = await client.patch(
            f"/orders/provider/{order_id}/items",
            params=provider_params,
            headers=provider_bearer,
            json={"status": status},
        )
        assert response.status_code == 200, response.text


async def test_create_order_attributes_share_channel(
    client: AsyncClient,
    share_ctx: dict,
    db_session,
) -> None:
    order = await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "ig-4f2k",
            },
        ],
    )
    assert order["items"][0]["share_channel"] == "IG"

    result = await db_session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order["id"]
        )
    )
    rows = list(result.scalars().all())
    assert len(rows) == 1
    assert rows[0].share_channel == ShareChannel.IG
    assert rows[0].finished_at is None


async def test_create_order_rejects_mismatched_or_plain_codes(
    client: AsyncClient,
    share_ctx: dict,
    db_session,
) -> None:
    order = await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "4F2K",
            },
            {
                "product_id": share_ctx["product_b_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 700, "currency": "cup"},
                "share_code": "IG-ZZZZ",
            },
            {
                "product_id": share_ctx["product_c_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 600, "currency": "cup"},
                "share_code": "arroz",
            },
        ],
    )
    assert all(item["share_channel"] is None for item in order["items"])

    result = await db_session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order["id"]
        )
    )
    assert list(result.scalars().all()) == []


async def test_create_order_one_fact_per_channel(
    client: AsyncClient,
    share_ctx: dict,
    db_session,
) -> None:
    order = await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "IG-4F2K",
            },
            {
                "product_id": share_ctx["product_c_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 600, "currency": "cup"},
                "share_code": "IG-C3MN",
            },
            {
                "product_id": share_ctx["product_b_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 700, "currency": "cup"},
                "share_code": "FB-B7QX",
            },
        ],
    )
    channels = {item["share_channel"] for item in order["items"]}
    assert channels == {"IG", "FB"}

    result = await db_session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order["id"]
        )
    )
    rows = list(result.scalars().all())
    assert {row.share_channel for row in rows} == {
        ShareChannel.IG,
        ShareChannel.FB,
    }
    assert all(row.finished_at is None for row in rows)


async def test_finish_marks_only_delivered_channels(
    client: AsyncClient,
    share_ctx: dict,
    db_session,
) -> None:
    order = await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "IG-4F2K",
            },
            {
                "product_id": share_ctx["product_b_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 700, "currency": "cup"},
                "share_code": "FB-B7QX",
            },
        ],
    )
    order_id = order["id"]

    cancel = await client.patch(
        f"/orders/provider/{order_id}/items",
        params=share_ctx["provider_a_params"],
        headers=share_ctx["provider_bearer"],
        json={"status": "canceled"},
    )
    assert cancel.status_code == 200, cancel.text

    await _deliver_provider_items(
        client,
        order_id=order_id,
        provider_params=share_ctx["provider_b_params"],
        provider_bearer=share_ctx["provider_bearer"],
    )

    seller_view = await client.get(
        f"/orders/seller/{order_id}",
        params=share_ctx["seller_params"],
        headers=share_ctx["seller_bearer"],
    )
    assert seller_view.status_code == 200
    assert seller_view.json()["status"] == "finished"

    db_session.expire_all()
    result = await db_session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order_id
        )
    )
    by_channel = {row.share_channel: row for row in result.scalars().all()}
    assert by_channel[ShareChannel.IG].finished_at is None
    assert by_channel[ShareChannel.FB].finished_at is not None


async def test_sync_clears_finished_at_when_leaving_finished(
    client: AsyncClient,
    share_ctx: dict,
    db_session,
) -> None:
    order = await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "IG-4F2K",
            },
        ],
    )
    await _deliver_provider_items(
        client,
        order_id=order["id"],
        provider_params=share_ctx["provider_a_params"],
        provider_bearer=share_ctx["provider_bearer"],
    )

    db_session.expire_all()
    result = await db_session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order["id"]
        )
    )
    row = result.scalar_one()
    assert row.finished_at is not None

    db_order = await db_session.get(Order, order["id"])
    assert db_order is not None
    db_order.status = OrderStatus.processing
    await db_session.flush()
    await share_conversion_service.sync_share_conversions_for_order(
        db_session,
        order["id"],
    )
    await db_session.commit()

    db_session.expire_all()
    result = await db_session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order["id"]
        )
    )
    assert result.scalar_one().finished_at is None


async def test_seller_dashboard_share_conversions(
    client: AsyncClient,
    share_ctx: dict,
) -> None:
    order = await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "IG-4F2K",
            },
            {
                "product_id": share_ctx["product_b_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 700, "currency": "cup"},
                "share_code": "FB-B7QX",
            },
        ],
    )
    await _deliver_provider_items(
        client,
        order_id=order["id"],
        provider_params=share_ctx["provider_a_params"],
        provider_bearer=share_ctx["provider_bearer"],
    )
    await _deliver_provider_items(
        client,
        order_id=order["id"],
        provider_params=share_ctx["provider_b_params"],
        provider_bearer=share_ctx["provider_bearer"],
    )

    await _create_order(
        client,
        share_ctx,
        [
            {
                "product_id": share_ctx["product_a_id"],
                "quantity": 1,
                "seller_provider_price": {"amount": 1000, "currency": "cup"},
                "share_code": "IG-4F2K",
            },
        ],
    )

    response = await client.get(
        "/dashboard/seller/",
        params={**share_ctx["seller_params"], "period": "30d"},
        headers=share_ctx["seller_bearer"],
    )
    assert response.status_code == 200, response.text
    data = response.json()
    by_channel = {row["channel"]: row for row in data["share_conversions"]}

    assert by_channel["IG"]["orders_arrived"] == 2
    assert by_channel["IG"]["orders_finished"] == 1
    assert by_channel["IG"]["conversion_rate"] == 0.5

    assert by_channel["FB"]["orders_arrived"] == 1
    assert by_channel["FB"]["orders_finished"] == 1
    assert by_channel["FB"]["conversion_rate"] == 1.0
