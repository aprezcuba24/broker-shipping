from __future__ import annotations

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
async def provider_dashboard_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    client: AsyncClient,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    outsider = await user_factory.build()

    provider = await organization_factory.build(user_id=provider_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])

    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller_org["id"],
    )

    product = await product_factory.build(
        organization_id=provider["id"],
        commission=50,
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
                    "quantity": 3,
                    "seller_provider_price": 2000,
                },
            ],
        },
    )
    assert create.status_code == 201, create.text
    order = create.json()

    return {
        "provider_id": provider["id"],
        "seller_org_id": seller_org["id"],
        "outsider_id": outsider["id"],
        "order_id": order["id"],
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_params": {"organization_id": provider["id"]},
        "seller_params": {"organization_id": seller_org["id"]},
    }


async def test_provider_dashboard_happy_path(
    client: AsyncClient,
    provider_dashboard_ctx: dict,
) -> None:
    ctx = provider_dashboard_ctx
    response = await client.get(
        "/dashboard/provider/",
        params={**ctx["provider_params"], "period": "30d"},
        headers=ctx["provider_bearer"],
    )
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["period"] == "30d"
    assert data["products_total"] == 1
    assert data["linked_sellers_total"] == 1
    assert data["orders_active"] == 1
    assert data["items_pending_action"] >= 1

    sales = {row["currency"]: row["amount"] for row in data["sales_by_currency"]}
    assert sales.get("cup") == 6000  # 2000 * 3

    by_status = {row["status"]: row["count"] for row in data["orders_by_status"]}
    assert by_status["created"] == 1
    assert len(data["recent_orders"]) == 1


async def test_provider_dashboard_requires_organization_id(
    client: AsyncClient,
    provider_dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/provider/",
        headers=provider_dashboard_ctx["provider_bearer"],
    )
    assert response.status_code == 422


async def test_provider_dashboard_non_member_forbidden(
    client: AsyncClient,
    provider_dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/provider/",
        params=provider_dashboard_ctx["provider_params"],
        headers=bearer_headers(user_id=provider_dashboard_ctx["outsider_id"]),
    )
    assert response.status_code == 403


async def test_provider_dashboard_seller_org_forbidden(
    client: AsyncClient,
    provider_dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/provider/",
        params=provider_dashboard_ctx["seller_params"],
        headers=provider_dashboard_ctx["seller_bearer"],
    )
    assert response.status_code == 403


async def test_provider_dashboard_invalid_period(
    client: AsyncClient,
    provider_dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/provider/",
        params={**provider_dashboard_ctx["provider_params"], "period": "year"},
        headers=provider_dashboard_ctx["provider_bearer"],
    )
    assert response.status_code == 422
