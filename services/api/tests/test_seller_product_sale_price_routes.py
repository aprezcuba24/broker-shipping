from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.models.order.enums import Currency
from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_product_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()

    provider = await organization_factory.build(user_id=provider_user["id"])
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
        provider_organization_id=provider["id"],
        seller_organization_id=other_seller_org["id"],
    )

    product = await product_factory.build(
        organization_id=provider["id"],
        name="Arroz",
        currency=Currency.cup,
        price=800,
        commission=150,
    )

    return {
        "product_id": product["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "other_seller_bearer": bearer_headers(user_id=other_seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "other_seller_params": {"organization_id": other_seller_org["id"]},
    }


async def test_upsert_and_clear_sale_price(
    client: AsyncClient,
    seller_product_ctx: dict,
) -> None:
    product_id = seller_product_ctx["product_id"]

    put = await client.patch(
        f"/products/seller/{product_id}",
        params=seller_product_ctx["seller_params"],
        headers=seller_product_ctx["seller_bearer"],
        json={"sale_price": {"amount": 1000, "currency": "cup"}},
    )
    assert put.status_code == 200, put.text
    assert put.json()["sale_price"] == {"amount": 1000, "currency": "cup"}
    assert put.json()["price"] == {"amount": 800, "currency": "cup"}

    detail = await client.get(
        f"/products/seller/{product_id}",
        params=seller_product_ctx["seller_params"],
        headers=seller_product_ctx["seller_bearer"],
    )
    assert detail.status_code == 200
    assert detail.json()["sale_price"] == {"amount": 1000, "currency": "cup"}

    other = await client.get(
        f"/products/seller/{product_id}",
        params=seller_product_ctx["other_seller_params"],
        headers=seller_product_ctx["other_seller_bearer"],
    )
    assert other.status_code == 200
    assert other.json()["sale_price"] is None

    clear = await client.patch(
        f"/products/seller/{product_id}",
        params=seller_product_ctx["seller_params"],
        headers=seller_product_ctx["seller_bearer"],
        json={"sale_price": None},
    )
    assert clear.status_code == 200, clear.text
    assert clear.json()["sale_price"] is None


async def test_sale_price_rejects_below_provider(
    client: AsyncClient,
    seller_product_ctx: dict,
) -> None:
    response = await client.patch(
        f"/products/seller/{seller_product_ctx['product_id']}",
        params=seller_product_ctx["seller_params"],
        headers=seller_product_ctx["seller_bearer"],
        json={"sale_price": {"amount": 700, "currency": "cup"}},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "seller_price_below_provider"


async def test_sale_price_rejects_currency_mismatch(
    client: AsyncClient,
    seller_product_ctx: dict,
) -> None:
    response = await client.patch(
        f"/products/seller/{seller_product_ctx['product_id']}",
        params=seller_product_ctx["seller_params"],
        headers=seller_product_ctx["seller_bearer"],
        json={"sale_price": {"amount": 1000, "currency": "usd"}},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "currency_mismatch"
