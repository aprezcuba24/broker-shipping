import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.models.order.enums import Currency
from tests.factories.auth_helpers import bearer_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def stock_order_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_org["id"],
        seller_organization_id=seller_org["id"],
    )
    product = await product_factory.build(
        organization_id=provider_org["id"],
        name="Arroz",
        currency=Currency.cup,
        commission=100,
        price=800,
        stock=10,
    )
    customer = await customer_factory.build(seller_organization_id=seller_org["id"])
    return {
        "provider_user_id": provider_user["id"],
        "seller_user_id": seller_user["id"],
        "provider_org_id": provider_org["id"],
        "seller_org_id": seller_org["id"],
        "product_id": product["id"],
        "customer_id": customer["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "provider_params": {"organization_id": provider_org["id"]},
    }


async def _get_product_stock(client: AsyncClient, ctx: dict) -> dict:
    r = await client.get(
        f"/products/provider/{ctx['product_id']}",
        params=ctx["provider_params"],
        headers=ctx["provider_bearer"],
    )
    assert r.status_code == 200
    return r.json()


async def test_create_order_reserves_stock(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json={
            "customer_id": stock_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": stock_order_ctx["product_id"],
                    "quantity": 4,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r.status_code == 201
    product = await _get_product_stock(client, stock_order_ctx)
    assert product["stock"] == 6
    assert product["reserved"] == 4


async def test_create_order_insufficient_stock_is_409(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json={
            "customer_id": stock_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": stock_order_ctx["product_id"],
                    "quantity": 11,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r.status_code == 409
    body = r.json()
    assert body["code"] == "insufficient_stock"
    assert body["params"]["product_name"] == "Arroz"
    assert body["params"]["available"] == 10
    assert body["params"]["requested"] == 11
    assert "Arroz" in body["message"]
    assert "10" in body["message"]
    assert "11" in body["message"]
    product = await _get_product_stock(client, stock_order_ctx)
    assert product["stock"] == 10
    assert product["reserved"] == 0


async def test_preview_order_insufficient_stock_is_409(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/preview",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json=[
            {
                "product_id": stock_order_ctx["product_id"],
                "quantity": 11,
                "seller_provider_price": 900,
            },
        ],
    )
    assert r.status_code == 409
    body = r.json()
    assert body["code"] == "insufficient_stock"
    assert body["params"]["product_name"] == "Arroz"
    assert body["params"]["available"] == 10
    assert body["params"]["requested"] == 11
    assert "No hay stock suficiente de Arroz" in body["message"]
    product = await _get_product_stock(client, stock_order_ctx)
    assert product["stock"] == 10
    assert product["reserved"] == 0


async def test_cancel_order_item_releases_stock(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r_create = await client.post(
        "/orders/seller/",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json={
            "customer_id": stock_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": stock_order_ctx["product_id"],
                    "quantity": 3,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r_create.status_code == 201
    order_id = r_create.json()["id"]

    r_cancel = await client.patch(
        f"/orders/provider/{order_id}/items",
        params=stock_order_ctx["provider_params"],
        headers=stock_order_ctx["provider_bearer"],
        json={"status": "canceled"},
    )
    assert r_cancel.status_code == 200
    assert r_cancel.json()["status"] == "canceled"

    product = await _get_product_stock(client, stock_order_ctx)
    assert product["stock"] == 10
    assert product["reserved"] == 0


async def test_deliver_order_item_consumes_reserved(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r_create = await client.post(
        "/orders/seller/",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json={
            "customer_id": stock_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": stock_order_ctx["product_id"],
                    "quantity": 3,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r_create.status_code == 201
    order_id = r_create.json()["id"]

    for status in ("reviewed", "sent", "delivered"):
        r = await client.patch(
            f"/orders/provider/{order_id}/items",
            params=stock_order_ctx["provider_params"],
            headers=stock_order_ctx["provider_bearer"],
            json={"status": status},
        )
        assert r.status_code == 200

    product = await _get_product_stock(client, stock_order_ctx)
    assert product["stock"] == 7
    assert product["reserved"] == 0


async def test_duplicate_product_in_order_is_422(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json={
            "customer_id": stock_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": stock_order_ctx["product_id"],
                    "quantity": 1,
                    "seller_provider_price": 900,
                },
                {
                    "product_id": stock_order_ctx["product_id"],
                    "quantity": 2,
                    "seller_provider_price": 900,
                },
            ],
        },
    )
    assert r.status_code == 422


async def test_duplicate_product_in_preview_is_422(
    client: AsyncClient,
    stock_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/preview",
        params=stock_order_ctx["seller_params"],
        headers=stock_order_ctx["seller_bearer"],
        json=[
            {
                "product_id": stock_order_ctx["product_id"],
                "quantity": 1,
                "seller_provider_price": 900,
            },
            {
                "product_id": stock_order_ctx["product_id"],
                "quantity": 2,
                "seller_provider_price": 900,
            },
        ],
    )
    assert r.status_code == 422
