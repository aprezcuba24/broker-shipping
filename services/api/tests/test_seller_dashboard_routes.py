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
async def dashboard_ctx(
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
        commission=100,
        price=1000,
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
                    "seller_provider_price": 1500,
                },
            ],
        },
    )
    assert create.status_code == 201, create.text
    order = create.json()

    for status in ("reviewed", "sent", "delivered"):
        response = await client.patch(
            f"/orders/provider/{order['id']}/items",
            params={"organization_id": provider["id"]},
            headers=bearer_headers(user_id=provider_user["id"]),
            json={"status": status},
        )
        assert response.status_code == 200, response.text

    return {
        "provider_id": provider["id"],
        "seller_org_id": seller_org["id"],
        "seller_user_id": seller_user["id"],
        "provider_user_id": provider_user["id"],
        "outsider_id": outsider["id"],
        "order_id": order["id"],
        "customer_name": customer["name"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "provider_params": {"organization_id": provider["id"]},
    }


async def test_seller_dashboard_happy_path(
    client: AsyncClient,
    dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/seller/",
        params={**dashboard_ctx["seller_params"], "period": "30d"},
        headers=dashboard_ctx["seller_bearer"],
    )
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["period"] == "30d"
    assert data["period_start"] is not None
    assert data["customers_total"] == 1
    assert data["linked_providers_total"] == 1
    assert data["products_available_total"] == 1
    assert data["orders_active"] == 0  # delivered → finished

    sales = {row["currency"]: row["amount"] for row in data["sales_by_currency"]}
    assert sales.get("cup") == 3000  # 1500 * 2

    pending = {
        row["currency"]: row["amount"] for row in data["commissions_pending"]
    }
    assert pending.get("cup") == 200  # commission 100 * qty 2

    assert data["commissions_paid"] == []
    assert len(data["recent_orders"]) == 1
    assert data["recent_orders"][0]["code"]
    assert data["recent_orders"][0]["customer_name"] == dashboard_ctx["customer_name"]
    assert len(data["recent_pending_commissions"]) == 1

    by_status = {row["status"]: row["count"] for row in data["orders_by_status"]}
    assert by_status["finished"] == 1
    assert by_status["created"] == 0


async def test_seller_dashboard_requires_organization_id(
    client: AsyncClient,
    dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/seller/",
        headers=dashboard_ctx["seller_bearer"],
    )
    assert response.status_code == 422


async def test_seller_dashboard_non_member_forbidden(
    client: AsyncClient,
    dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/seller/",
        params=dashboard_ctx["seller_params"],
        headers=bearer_headers(user_id=dashboard_ctx["outsider_id"]),
    )
    assert response.status_code == 403


async def test_seller_dashboard_provider_org_forbidden(
    client: AsyncClient,
    dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/seller/",
        params=dashboard_ctx["provider_params"],
        headers=dashboard_ctx["provider_bearer"],
    )
    assert response.status_code == 403


async def test_seller_dashboard_invalid_period(
    client: AsyncClient,
    dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/seller/",
        params={**dashboard_ctx["seller_params"], "period": "1y"},
        headers=dashboard_ctx["seller_bearer"],
    )
    assert response.status_code == 422


async def test_seller_dashboard_period_all(
    client: AsyncClient,
    dashboard_ctx: dict,
) -> None:
    response = await client.get(
        "/dashboard/seller/",
        params={**dashboard_ctx["seller_params"], "period": "all"},
        headers=dashboard_ctx["seller_bearer"],
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["period"] == "all"
    assert data["period_start"] is None
