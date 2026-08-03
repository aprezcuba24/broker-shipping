from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient

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
async def commission_order_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    client: AsyncClient,
) -> dict:
    provider_a_user = await user_factory.build()
    provider_b_user = await user_factory.build()
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()

    provider_a = await organization_factory.build(user_id=provider_a_user["id"])
    provider_b = await organization_factory.build(user_id=provider_b_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )

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
        commission=100,
        price=1000,
    )
    product_b = await product_factory.build(
        organization_id=provider_b["id"],
        commission=200,
        price=2000,
    )
    customer = await customer_factory.build(seller_organization_id=seller_org["id"])

    create = await client.post(
        "/orders/seller/",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
        json={
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product_a["id"],
                    "quantity": 2,
                    "seller_provider_price": 1000,
                },
                {
                    "product_id": product_b["id"],
                    "quantity": 1,
                    "seller_provider_price": 2000,
                },
            ],
        },
    )
    assert create.status_code == 201
    order = create.json()

    return {
        "provider_a_id": provider_a["id"],
        "provider_b_id": provider_b["id"],
        "seller_org_id": seller_org["id"],
        "other_seller_org_id": other_seller_org["id"],
        "other_seller_user_id": other_seller_user["id"],
        "order_id": order["id"],
        "provider_a_bearer": bearer_headers(user_id=provider_a_user["id"]),
        "provider_b_bearer": bearer_headers(user_id=provider_b_user["id"]),
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_a_params": {"organization_id": provider_a["id"]},
        "provider_b_params": {"organization_id": provider_b["id"]},
        "seller_params": {"organization_id": seller_org["id"]},
    }


async def _advance_to_delivered(
    client: AsyncClient,
    order_id: str,
    params: dict,
    headers: dict,
) -> None:
    for status in ("reviewed", "sent", "delivered"):
        response = await client.patch(
            f"/orders/provider/{order_id}/items",
            params=params,
            headers=headers,
            json={"status": status},
        )
        assert response.status_code == 200, response.text


async def test_seller_sees_paid_and_unpaid_commissions(
    client: AsyncClient,
    commission_order_ctx: dict,
) -> None:
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_a_params"],
        commission_order_ctx["provider_a_bearer"],
    )
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_b_params"],
        commission_order_ctx["provider_b_bearer"],
    )

    listed = await client.get(
        "/commissions/seller/",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
    )
    assert listed.status_code == 200
    page = listed.json()
    assert page["total"] == 2
    amounts = {item["amount"] for item in page["items"]}
    assert amounts == {200}

    unpaid_only = await client.get(
        "/commissions/seller/",
        params={**commission_order_ctx["seller_params"], "is_paid": False},
        headers=commission_order_ctx["seller_bearer"],
    )
    assert unpaid_only.json()["total"] == 2

    commission_a = next(
        item
        for item in page["items"]
        if item["provider_organization_id"] == commission_order_ctx["provider_a_id"]
    )
    paid = await client.patch(
        f"/commissions/provider/{commission_a['id']}",
        params=commission_order_ctx["provider_a_params"],
        headers=commission_order_ctx["provider_a_bearer"],
        json={},
    )
    assert paid.status_code == 200

    all_after = await client.get(
        "/commissions/seller/",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
    )
    assert all_after.json()["total"] == 2

    unpaid_after = await client.get(
        "/commissions/seller/",
        params={**commission_order_ctx["seller_params"], "is_paid": False},
        headers=commission_order_ctx["seller_bearer"],
    )
    assert unpaid_after.json()["total"] == 1

    paid_after = await client.get(
        "/commissions/seller/",
        params={**commission_order_ctx["seller_params"], "is_paid": True},
        headers=commission_order_ctx["seller_bearer"],
    )
    assert paid_after.json()["total"] == 1


async def test_seller_get_and_cross_tenant(
    client: AsyncClient,
    commission_order_ctx: dict,
) -> None:
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_a_params"],
        commission_order_ctx["provider_a_bearer"],
    )
    listed = await client.get(
        "/commissions/seller/",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
    )
    commission_id = listed.json()["items"][0]["id"]

    detail = await client.get(
        f"/commissions/seller/{commission_id}",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
    )
    assert detail.status_code == 200
    assert detail.json()["id"] == commission_id

    other = await client.get(
        f"/commissions/seller/{commission_id}",
        params={"organization_id": commission_order_ctx["other_seller_org_id"]},
        headers=bearer_headers(user_id=commission_order_ctx["other_seller_user_id"]),
    )
    assert other.status_code == 404

    unknown = await client.get(
        f"/commissions/seller/{uuid4()}",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
    )
    assert unknown.status_code == 404


async def test_seller_cannot_mark_paid(
    client: AsyncClient,
    commission_order_ctx: dict,
) -> None:
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_a_params"],
        commission_order_ctx["provider_a_bearer"],
    )
    listed = await client.get(
        "/commissions/seller/",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
    )
    commission_id = listed.json()["items"][0]["id"]

    mark = await client.patch(
        f"/commissions/seller/{commission_id}",
        params=commission_order_ctx["seller_params"],
        headers=commission_order_ctx["seller_bearer"],
        json={},
    )
    assert mark.status_code == 405


async def test_seller_commission_auth(
    client: AsyncClient,
    commission_order_ctx: dict,
    user_factory: UserFactory,
) -> None:
    outsider = await user_factory.build()
    forbidden = await client.get(
        "/commissions/seller/",
        params=commission_order_ctx["seller_params"],
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert forbidden.status_code == 403

    missing_org = await client.get(
        "/commissions/seller/",
        headers=commission_order_ctx["seller_bearer"],
    )
    assert missing_org.status_code == 422
