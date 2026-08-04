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
    provider_user = await user_factory.build()
    other_provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()

    provider = await organization_factory.build(
        user_id=provider_user["id"],
        name="Commission Provider",
    )
    other_provider = await organization_factory.build(
        user_id=other_provider_user["id"],
        name="Other Provider",
    )
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )

    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=other_provider["id"],
        seller_organization_id=seller_org["id"],
    )

    product = await product_factory.build(
        organization_id=provider["id"],
        name="Commission Product",
        commission=100,
        price=1000,
    )
    other_product = await product_factory.build(
        organization_id=other_provider["id"],
        name="Other Product",
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
                    "product_id": product["id"],
                    "quantity": 2,
                    "seller_provider_price": 1000,
                },
                {
                    "product_id": other_product["id"],
                    "quantity": 1,
                    "seller_provider_price": 2000,
                },
            ],
        },
    )
    assert create.status_code == 201
    order = create.json()

    return {
        "provider_id": provider["id"],
        "other_provider_id": other_provider["id"],
        "seller_org_id": seller_org["id"],
        "other_seller_org_id": other_seller_org["id"],
        "other_seller_user_id": other_seller_user["id"],
        "order_id": order["id"],
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "other_provider_bearer": bearer_headers(user_id=other_provider_user["id"]),
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_params": {"organization_id": provider["id"]},
        "other_provider_params": {"organization_id": other_provider["id"]},
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


async def test_provider_list_shows_commission_after_delivered(
    client: AsyncClient,
    commission_order_ctx: dict,
) -> None:
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_params"],
        commission_order_ctx["provider_bearer"],
    )

    listed = await client.get(
        "/commissions/provider/",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
    )
    assert listed.status_code == 200
    page = listed.json()
    assert page["total"] == 1
    commission = page["items"][0]
    assert commission["order_id"] == commission_order_ctx["order_id"]
    assert commission["provider_organization_id"] == commission_order_ctx["provider_id"]
    assert commission["seller_organization_id"] == commission_order_ctx["seller_org_id"]
    assert commission["is_paid"] is False
    assert commission["amount"] == 200
    assert commission["currency"] == "cup"
    assert len(commission["order_item_ids"]) == 1

    detail = await client.get(
        f"/commissions/provider/{commission['id']}",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
    )
    assert detail.status_code == 200
    assert detail.json()["id"] == commission["id"]


async def test_provider_mark_paid_removes_from_default_list(
    client: AsyncClient,
    commission_order_ctx: dict,
) -> None:
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_params"],
        commission_order_ctx["provider_bearer"],
    )
    listed = await client.get(
        "/commissions/provider/",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
    )
    commission_id = listed.json()["items"][0]["id"]

    paid = await client.patch(
        f"/commissions/provider/{commission_id}",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
        json={},
    )
    assert paid.status_code == 200
    assert paid.json()["is_paid"] is True
    assert paid.json()["paid_at"] is not None

    unpaid = await client.get(
        "/commissions/provider/",
        params={**commission_order_ctx["provider_params"], "is_paid": False},
        headers=commission_order_ctx["provider_bearer"],
    )
    assert unpaid.status_code == 200
    assert unpaid.json()["total"] == 0

    paid_list = await client.get(
        "/commissions/provider/",
        params={**commission_order_ctx["provider_params"], "is_paid": True},
        headers=commission_order_ctx["provider_bearer"],
    )
    assert paid_list.status_code == 200
    assert paid_list.json()["total"] == 1

    again = await client.patch(
        f"/commissions/provider/{commission_id}",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
        json={},
    )
    assert again.status_code == 400


async def test_provider_cross_tenant_commission_404(
    client: AsyncClient,
    commission_order_ctx: dict,
) -> None:
    await _advance_to_delivered(
        client,
        commission_order_ctx["order_id"],
        commission_order_ctx["provider_params"],
        commission_order_ctx["provider_bearer"],
    )
    listed = await client.get(
        "/commissions/provider/",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
    )
    commission_id = listed.json()["items"][0]["id"]

    other = await client.get(
        f"/commissions/provider/{commission_id}",
        params=commission_order_ctx["other_provider_params"],
        headers=commission_order_ctx["other_provider_bearer"],
    )
    assert other.status_code == 404

    mark = await client.patch(
        f"/commissions/provider/{commission_id}",
        params=commission_order_ctx["other_provider_params"],
        headers=commission_order_ctx["other_provider_bearer"],
        json={},
    )
    assert mark.status_code == 404

    unknown = await client.get(
        f"/commissions/provider/{uuid4()}",
        params=commission_order_ctx["provider_params"],
        headers=commission_order_ctx["provider_bearer"],
    )
    assert unknown.status_code == 404


async def test_provider_commission_auth(
    client: AsyncClient,
    commission_order_ctx: dict,
    user_factory: UserFactory,
) -> None:
    outsider = await user_factory.build()
    forbidden = await client.get(
        "/commissions/provider/",
        params=commission_order_ctx["provider_params"],
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert forbidden.status_code == 403

    missing_org = await client.get(
        "/commissions/provider/",
        headers=commission_order_ctx["provider_bearer"],
    )
    assert missing_org.status_code == 422
