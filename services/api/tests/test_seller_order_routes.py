from decimal import Decimal
from uuid import uuid4

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
async def seller_order_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()

    provider_cup = await organization_factory.build(
        user_id=provider_user["id"],
        name="Provider CUP",
    )
    provider_usd = await organization_factory.build(
        user_id=provider_user["id"],
        name="Provider USD",
    )
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )

    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_cup["id"],
        seller_organization_id=seller_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_usd["id"],
        seller_organization_id=seller_org["id"],
    )

    product_cup = await product_factory.build(
        organization_id=provider_cup["id"],
        name="Arroz",
        currency=Currency.cup,
        commission=Decimal("1.50"),
        price=Decimal("8.00"),
    )
    product_usd = await product_factory.build(
        organization_id=provider_usd["id"],
        name="Phone",
        currency=Currency.usd,
        commission=Decimal("5.00"),
        price=Decimal("20.00"),
    )
    customer = await customer_factory.build(seller_organization_id=seller_org["id"])
    other_customer = await customer_factory.build(
        seller_organization_id=other_seller_org["id"],
    )

    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "other_seller_user_id": other_seller_user["id"],
        "other_seller_org_id": other_seller_org["id"],
        "provider_cup_id": provider_cup["id"],
        "provider_usd_id": provider_usd["id"],
        "product_cup_id": product_cup["id"],
        "product_usd_id": product_usd["id"],
        "customer_id": customer["id"],
        "other_customer_id": other_customer["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "other_seller_bearer": bearer_headers(user_id=other_seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "other_seller_params": {"organization_id": other_seller_org["id"]},
    }


async def test_create_order_with_mixed_currencies(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 2,
                    "seller_provider_price": "10.00",
                    "customer_change": "1.00",
                },
                {
                    "product_id": seller_order_ctx["product_usd_id"],
                    "quantity": 1,
                    "seller_provider_price": "25.50",
                },
            ],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["code"] == "O-00001"
    assert body["status"] == "created"
    assert body["customer_id"] == seller_order_ctx["customer_id"]
    assert len(body["items"]) == 2

    by_product = {item["product_id"]: item for item in body["items"]}
    cup_item = by_product[seller_order_ctx["product_cup_id"]]
    assert cup_item["provider_organization_id"] == seller_order_ctx["provider_cup_id"]
    assert cup_item["currency"] == "cup"
    assert cup_item["seller_commission"] == "1.50"
    assert cup_item["unit_provider_price"] == "8.00"
    assert cup_item["seller_provider_price"] == "10.00"
    assert cup_item["customer_change"] == "1.00"
    assert cup_item["quantity"] == 2
    assert cup_item["status"] == "created"

    usd_item = by_product[seller_order_ctx["product_usd_id"]]
    assert usd_item["provider_organization_id"] == seller_order_ctx["provider_usd_id"]
    assert usd_item["currency"] == "usd"
    assert usd_item["seller_commission"] == "5.00"
    assert usd_item["unit_provider_price"] == "20.00"
    assert usd_item["customer_change"] == "0.00"

    totals = {t["currency"]: t["amount"] for t in body["totals"]}
    assert totals == {"cup": "20.00", "usd": "25.50"}


async def test_create_order_defaults_seller_provider_price(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 3,
                },
            ],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["items"][0]["unit_provider_price"] == "8.00"
    assert body["items"][0]["seller_provider_price"] == "8.00"
    assert body["totals"] == [{"currency": "cup", "amount": "24.00"}]


async def test_create_order_increments_code_per_seller(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    payload = {
        "customer_id": seller_order_ctx["customer_id"],
        "items": [
            {
                "product_id": seller_order_ctx["product_cup_id"],
                "quantity": 1,
                "seller_provider_price": "10.00",
            },
        ],
    }
    first = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=payload,
    )
    second = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=payload,
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["code"] == "O-00001"
    assert second.json()["code"] == "O-00002"


async def test_create_order_rejects_foreign_customer(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["other_customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                },
            ],
        },
    )
    assert r.status_code == 404


async def test_create_order_rejects_unlinked_product(
    client: AsyncClient,
    seller_order_ctx: dict,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    provider_user = await user_factory.build()
    unlinked_provider = await organization_factory.build(user_id=provider_user["id"])
    unlinked_product = await product_factory.build(
        organization_id=unlinked_provider["id"],
    )
    r = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": unlinked_product["id"],
                    "quantity": 1,
                },
            ],
        },
    )
    assert r.status_code == 404


async def test_list_and_get_orders(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    created = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 2,
                    "seller_provider_price": "10.00",
                },
                {
                    "product_id": seller_order_ctx["product_usd_id"],
                    "quantity": 1,
                    "seller_provider_price": "25.00",
                },
            ],
        },
    )
    assert created.status_code == 201
    order_id = created.json()["id"]

    listed = await client.get(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
    )
    assert listed.status_code == 200
    page = listed.json()
    assert page["total"] == 1
    assert page["page"] == 1
    assert len(page["items"]) == 1
    assert page["items"][0]["id"] == order_id
    assert {t["currency"]: t["amount"] for t in page["items"][0]["totals"]} == {
        "cup": "20.00",
        "usd": "25.00",
    }

    detail = await client.get(
        f"/orders/seller/{order_id}",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
    )
    assert detail.status_code == 200
    body = detail.json()
    assert body["id"] == order_id
    assert len(body["items"]) == 2
    assert {t["currency"]: t["amount"] for t in body["totals"]} == {
        "cup": "20.00",
        "usd": "25.00",
    }


async def test_seller_cannot_see_other_seller_order(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    created = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                    "seller_provider_price": "10.00",
                },
            ],
        },
    )
    assert created.status_code == 201
    order_id = created.json()["id"]

    r = await client.get(
        f"/orders/seller/{order_id}",
        params=seller_order_ctx["other_seller_params"],
        headers=seller_order_ctx["other_seller_bearer"],
    )
    assert r.status_code == 404


async def test_create_order_validation_errors(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    empty_items = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [],
        },
    )
    assert empty_items.status_code == 422

    bad_quantity = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 0,
                },
            ],
        },
    )
    assert bad_quantity.status_code == 422

    negative_price = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                    "seller_provider_price": "-1.00",
                },
            ],
        },
    )
    assert negative_price.status_code == 422

    negative_change = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                    "customer_change": "-0.01",
                },
            ],
        },
    )
    assert negative_change.status_code == 422

    missing_org = await client.post(
        "/orders/seller/",
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                },
            ],
        },
    )
    assert missing_org.status_code == 422


async def test_create_order_forbidden_for_non_member(
    client: AsyncClient,
    seller_order_ctx: dict,
    user_factory: UserFactory,
) -> None:
    outsider = await user_factory.build()
    r = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=bearer_headers(user_id=outsider["id"]),
        json={
            "customer_id": seller_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                },
            ],
        },
    )
    assert r.status_code == 403


async def test_provider_org_cannot_use_seller_order_routes(
    client: AsyncClient,
    seller_order_ctx: dict,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider_user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    r = await client.get(
        "/orders/seller/",
        params={"organization_id": provider_org["id"]},
        headers=bearer_headers(user_id=provider_user["id"]),
    )
    assert r.status_code == 403


async def test_get_unknown_order_returns_404(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.get(
        f"/orders/seller/{uuid4()}",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
    )
    assert r.status_code == 404


async def test_preview_order_with_mixed_currencies(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/preview",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=[
            {
                "product_id": seller_order_ctx["product_cup_id"],
                "quantity": 2,
                "seller_provider_price": "10.00",
                "customer_change": "1.00",
            },
            {
                "product_id": seller_order_ctx["product_usd_id"],
                "quantity": 1,
                "seller_provider_price": "25.50",
            },
        ],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == ""
    assert body["status"] == "created"
    assert body["seller_organization_id"] == seller_order_ctx["seller_org_id"]
    assert len(body["items"]) == 2

    by_product = {item["product_id"]: item for item in body["items"]}
    cup_item = by_product[seller_order_ctx["product_cup_id"]]
    assert cup_item["provider_organization_id"] == seller_order_ctx["provider_cup_id"]
    assert cup_item["currency"] == "cup"
    assert cup_item["seller_commission"] == "1.50"
    assert cup_item["unit_provider_price"] == "8.00"
    assert cup_item["seller_provider_price"] == "10.00"
    assert cup_item["customer_change"] == "1.00"
    assert cup_item["quantity"] == 2
    assert cup_item["status"] == "created"

    usd_item = by_product[seller_order_ctx["product_usd_id"]]
    assert usd_item["provider_organization_id"] == seller_order_ctx["provider_usd_id"]
    assert usd_item["currency"] == "usd"
    assert usd_item["seller_commission"] == "5.00"
    assert usd_item["unit_provider_price"] == "20.00"
    assert usd_item["customer_change"] == "0.00"

    totals = {t["currency"]: t["amount"] for t in body["totals"]}
    assert totals == {"cup": "20.00", "usd": "25.50"}


async def test_preview_order_defaults_seller_provider_price(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/preview",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=[
            {
                "product_id": seller_order_ctx["product_cup_id"],
                "quantity": 3,
            },
        ],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["items"][0]["unit_provider_price"] == "8.00"
    assert body["items"][0]["seller_provider_price"] == "8.00"
    assert body["totals"] == [{"currency": "cup", "amount": "24.00"}]


async def test_preview_order_rejects_unlinked_product(
    client: AsyncClient,
    seller_order_ctx: dict,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    provider_user = await user_factory.build()
    unlinked_provider = await organization_factory.build(user_id=provider_user["id"])
    unlinked_product = await product_factory.build(
        organization_id=unlinked_provider["id"],
    )
    r = await client.post(
        "/orders/seller/preview",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=[
            {
                "product_id": unlinked_product["id"],
                "quantity": 1,
            },
        ],
    )
    assert r.status_code == 404


async def test_preview_order_empty_items_returns_422(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    r = await client.post(
        "/orders/seller/preview",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=[],
    )
    assert r.status_code == 422


async def test_preview_order_does_not_persist(
    client: AsyncClient,
    seller_order_ctx: dict,
) -> None:
    preview = await client.post(
        "/orders/seller/preview",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json=[
            {
                "product_id": seller_order_ctx["product_cup_id"],
                "quantity": 1,
                "seller_provider_price": "10.00",
            },
        ],
    )
    assert preview.status_code == 200

    listed = await client.get(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
    )
    assert listed.status_code == 200
    assert listed.json()["total"] == 0
