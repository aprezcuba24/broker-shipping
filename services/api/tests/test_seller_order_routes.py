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
        commission=150,
        price=800,
    )
    product_usd = await product_factory.build(
        organization_id=provider_usd["id"],
        name="Phone",
        currency=Currency.usd,
        commission=500,
        price=2000,
    )
    customer = await customer_factory.build(
        seller_organization_id=seller_org["id"],
        name="Maria Garcia",
        ci="85010112345",
        phone="55123456",
    )
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
        "customer_name": customer["name"],
        "customer_ci": customer["ci"],
        "customer_phone": customer["phone"],
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
                    "seller_provider_price": 1000,
                    "customer_change": 100,
                },
                {
                    "product_id": seller_order_ctx["product_usd_id"],
                    "quantity": 1,
                    "seller_provider_price": 2550,
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
    assert cup_item["seller_commission"] == 150
    assert cup_item["unit_provider_price"] == 800
    assert cup_item["seller_provider_price"] == 1000
    assert cup_item["customer_change"] == 100
    assert cup_item["quantity"] == 2
    assert cup_item["status"] == "created"

    usd_item = by_product[seller_order_ctx["product_usd_id"]]
    assert usd_item["provider_organization_id"] == seller_order_ctx["provider_usd_id"]
    assert usd_item["currency"] == "usd"
    assert usd_item["seller_commission"] == 500
    assert usd_item["unit_provider_price"] == 2000
    assert usd_item["customer_change"] == 0

    totals = {t["currency"]: t["amount"] for t in body["totals"]}
    assert totals == {"cup": 2000, "usd": 2550}


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
    assert body["items"][0]["unit_provider_price"] == 800
    assert body["items"][0]["seller_provider_price"] == 800
    assert body["totals"] == [{"currency": "cup", "amount": 2400}]


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
                "seller_provider_price": 1000,
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
                    "seller_provider_price": 1000,
                },
                {
                    "product_id": seller_order_ctx["product_usd_id"],
                    "quantity": 1,
                    "seller_provider_price": 2500,
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
        "cup": 2000,
        "usd": 2500,
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
        "cup": 2000,
        "usd": 2500,
    }
    assert body["customer"] is not None
    assert body["customer"]["id"] == seller_order_ctx["customer_id"]
    assert body["customer"]["name"] == seller_order_ctx["customer_name"]
    assert page["items"][0]["customer"]["name"] == seller_order_ctx["customer_name"]


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
                    "seller_provider_price": 1000,
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
                    "seller_provider_price": -100,
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
                    "customer_change": -1,
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
                "seller_provider_price": 1000,
                "customer_change": 100,
            },
            {
                "product_id": seller_order_ctx["product_usd_id"],
                "quantity": 1,
                "seller_provider_price": 2550,
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
    assert cup_item["seller_commission"] == 150
    assert cup_item["unit_provider_price"] == 800
    assert cup_item["seller_provider_price"] == 1000
    assert cup_item["customer_change"] == 100
    assert cup_item["quantity"] == 2
    assert cup_item["status"] == "created"

    usd_item = by_product[seller_order_ctx["product_usd_id"]]
    assert usd_item["provider_organization_id"] == seller_order_ctx["provider_usd_id"]
    assert usd_item["currency"] == "usd"
    assert usd_item["seller_commission"] == 500
    assert usd_item["unit_provider_price"] == 2000
    assert usd_item["customer_change"] == 0

    totals = {t["currency"]: t["amount"] for t in body["totals"]}
    assert totals == {"cup": 2000, "usd": 2550}


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
    assert body["items"][0]["unit_provider_price"] == 800
    assert body["items"][0]["seller_provider_price"] == 800
    assert body["totals"] == [{"currency": "cup", "amount": 2400}]


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
                "seller_provider_price": 1000,
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


async def test_list_orders_search_by_code_name_phone_ci(
    client: AsyncClient,
    seller_order_ctx: dict,
    customer_factory: CustomerFactory,
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
                    "seller_provider_price": 1000,
                },
            ],
        },
    )
    assert created.status_code == 201
    order_code = created.json()["code"]

    other_customer = await customer_factory.build(
        seller_organization_id=seller_order_ctx["seller_org_id"],
        name="Pedro Lopez",
        ci="99010199999",
        phone="55999999",
    )
    other_order = await client.post(
        "/orders/seller/",
        params=seller_order_ctx["seller_params"],
        headers=seller_order_ctx["seller_bearer"],
        json={
            "customer_id": other_customer["id"],
            "items": [
                {
                    "product_id": seller_order_ctx["product_cup_id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                },
            ],
        },
    )
    assert other_order.status_code == 201

    by_code = await client.get(
        "/orders/seller/",
        params={**seller_order_ctx["seller_params"], "search": order_code},
        headers=seller_order_ctx["seller_bearer"],
    )
    assert by_code.status_code == 200
    assert by_code.json()["total"] == 1
    assert by_code.json()["items"][0]["code"] == order_code

    by_name = await client.get(
        "/orders/seller/",
        params={**seller_order_ctx["seller_params"], "search": "Maria"},
        headers=seller_order_ctx["seller_bearer"],
    )
    assert by_name.status_code == 200
    assert by_name.json()["total"] == 1
    assert by_name.json()["items"][0]["customer"]["name"] == "Maria Garcia"

    by_phone = await client.get(
        "/orders/seller/",
        params={**seller_order_ctx["seller_params"], "search": "55123456"},
        headers=seller_order_ctx["seller_bearer"],
    )
    assert by_phone.status_code == 200
    assert by_phone.json()["total"] == 1
    assert by_phone.json()["items"][0]["customer"]["phone"] == "55123456"

    by_ci = await client.get(
        "/orders/seller/",
        params={**seller_order_ctx["seller_params"], "search": "85010112345"},
        headers=seller_order_ctx["seller_bearer"],
    )
    assert by_ci.status_code == 200
    assert by_ci.json()["total"] == 1
    assert by_ci.json()["items"][0]["customer"]["ci"] == "85010112345"
