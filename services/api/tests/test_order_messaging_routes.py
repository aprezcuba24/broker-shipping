from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

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


@pytest_asyncio.fixture
async def order_messaging_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    location_factory: LocationFactory,
) -> dict:
    provider_user = await user_factory.build()
    other_provider_user = await user_factory.build()
    seller_user = await user_factory.build()

    provider_a = await organization_factory.build(
        user_id=provider_user["id"],
        name="Provider A Messaging",
    )
    provider_b = await organization_factory.build(
        user_id=other_provider_user["id"],
        name="Provider B Messaging",
    )
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])

    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_a["id"],
        seller_organization_id=seller_org["id"],
        accepts_unconfigured_neighborhoods=None,
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_b["id"],
        seller_organization_id=seller_org["id"],
        accepts_unconfigured_neighborhoods=None,
    )

    product_a = await product_factory.build(
        organization_id=provider_a["id"],
        name="Producto A",
        currency=Currency.cup,
        price=1000,
        commission=100,
    )
    product_b = await product_factory.build(
        organization_id=provider_b["id"],
        name="Producto B",
        currency=Currency.cup,
        price=2000,
        commission=200,
    )

    province = await location_factory.build_province(name="Prov Messaging Order")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Mun Messaging Order",
    )
    neighborhood = await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Barrio Messaging Order",
    )
    customer = await customer_factory.build(
        seller_organization_id=seller_org["id"],
        name="Cliente Messaging",
        address="Calle 1",
        province_id=province["id"],
        municipality_id=municipality["id"],
        neighborhood_id=neighborhood["id"],
    )

    return {
        "seller_headers": bearer_headers(user_id=seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "provider_a_headers": bearer_headers(user_id=provider_user["id"]),
        "provider_a_params": {"organization_id": provider_a["id"]},
        "provider_b_headers": bearer_headers(user_id=other_provider_user["id"]),
        "provider_b_params": {"organization_id": provider_b["id"]},
        "provider_a_id": provider_a["id"],
        "provider_b_id": provider_b["id"],
        "product_a_id": product_a["id"],
        "product_b_id": product_b["id"],
        "customer_id": customer["id"],
        "neighborhood_id": neighborhood["id"],
    }


async def _create_price(
    client: AsyncClient,
    *,
    headers: dict,
    params: dict,
    neighborhood_id: str,
    amount: int = 500,
) -> dict:
    r = await client.post(
        "/messaging-prices/provider/",
        params=params,
        headers=headers,
        json={
            "neighborhood_id": neighborhood_id,
            "price": {"amount": amount, "currency": "cup"},
        },
    )
    assert r.status_code == 201
    return r.json()


async def _set_accepts(
    client: AsyncClient,
    *,
    headers: dict,
    params: dict,
    accepts: bool,
) -> None:
    r = await client.patch(
        "/messaging-settings/provider/",
        params=params,
        headers=headers,
        json={"accepts_unconfigured_neighborhoods": accepts},
    )
    assert r.status_code == 200


async def test_create_order_adds_messaging_line_when_priced(
    client: AsyncClient,
    order_messaging_ctx: dict,
) -> None:
    ctx = order_messaging_ctx
    await _create_price(
        client,
        headers=ctx["provider_a_headers"],
        params=ctx["provider_a_params"],
        neighborhood_id=ctx["neighborhood_id"],
        amount=750,
    )
    await _set_accepts(
        client,
        headers=ctx["provider_b_headers"],
        params=ctx["provider_b_params"],
        accepts=True,
    )

    r = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [
                {"product_id": ctx["product_a_id"], "quantity": 1},
                {"product_id": ctx["product_b_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert len(body["messaging"]) == 1
    line = body["messaging"][0]
    assert line["provider_organization_id"] == ctx["provider_a_id"]
    assert line["neighborhood_id"] == ctx["neighborhood_id"]
    assert line["price"] == {"amount": 750, "currency": "cup"}
    assert {"amount": 3750, "currency": "cup"} in body["totals"]


async def test_create_order_blocked_without_price_and_accepts_false(
    client: AsyncClient,
    order_messaging_ctx: dict,
) -> None:
    ctx = order_messaging_ctx
    r = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [
                {"product_id": ctx["product_a_id"], "quantity": 1},
                {"product_id": ctx["product_b_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 409
    body = r.json()
    assert body["code"] == "messaging_neighborhood_not_configured"
    assert "Provider A Messaging" in body["message"]
    assert "Provider B Messaging" in body["message"]


async def test_create_order_without_price_when_accepts_true(
    client: AsyncClient,
    order_messaging_ctx: dict,
) -> None:
    ctx = order_messaging_ctx
    await _set_accepts(
        client,
        headers=ctx["provider_a_headers"],
        params=ctx["provider_a_params"],
        accepts=True,
    )

    r = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [{"product_id": ctx["product_a_id"], "quantity": 2}],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["messaging"] == []
    assert body["totals"] == [{"amount": 2000, "currency": "cup"}]
    return body


async def test_provider_manual_create_and_patch_messaging(
    client: AsyncClient,
    order_messaging_ctx: dict,
) -> None:
    ctx = order_messaging_ctx
    await _set_accepts(
        client,
        headers=ctx["provider_a_headers"],
        params=ctx["provider_a_params"],
        accepts=True,
    )
    create = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [{"product_id": ctx["product_a_id"], "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["id"]
    assert create.json()["messaging"] == []

    r_add = await client.post(
        f"/orders/provider/{order_id}/messaging",
        params=ctx["provider_a_params"],
        headers=ctx["provider_a_headers"],
        json={"price": {"amount": 900, "currency": "cup"}},
    )
    assert r_add.status_code == 201
    messaging = r_add.json()["messaging"]
    assert len(messaging) == 1
    assert messaging[0]["price"] == {"amount": 900, "currency": "cup"}
    assert {"amount": 1900, "currency": "cup"} in r_add.json()["totals"]
    messaging_id = messaging[0]["id"]

    r_dup = await client.post(
        f"/orders/provider/{order_id}/messaging",
        params=ctx["provider_a_params"],
        headers=ctx["provider_a_headers"],
        json={"price": {"amount": 100, "currency": "cup"}},
    )
    assert r_dup.status_code == 409
    assert r_dup.json()["code"] == "order_messaging_exists"

    r_patch = await client.patch(
        f"/orders/provider/{order_id}/messaging/{messaging_id}",
        params=ctx["provider_a_params"],
        headers=ctx["provider_a_headers"],
        json={"price": {"amount": 1200, "currency": "cup"}},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["messaging"][0]["price"] == {
        "amount": 1200,
        "currency": "cup",
    }
    assert {"amount": 2200, "currency": "cup"} in r_patch.json()["totals"]

    seller_get = await client.get(
        f"/orders/seller/{order_id}",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
    )
    assert seller_get.status_code == 200
    assert seller_get.json()["messaging"][0]["price"]["amount"] == 1200


async def test_provider_cannot_see_other_provider_messaging(
    client: AsyncClient,
    order_messaging_ctx: dict,
) -> None:
    ctx = order_messaging_ctx
    await _create_price(
        client,
        headers=ctx["provider_a_headers"],
        params=ctx["provider_a_params"],
        neighborhood_id=ctx["neighborhood_id"],
        amount=400,
    )
    await _create_price(
        client,
        headers=ctx["provider_b_headers"],
        params=ctx["provider_b_params"],
        neighborhood_id=ctx["neighborhood_id"],
        amount=600,
    )
    create = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [
                {"product_id": ctx["product_a_id"], "quantity": 1},
                {"product_id": ctx["product_b_id"], "quantity": 1},
            ],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["id"]
    assert len(create.json()["messaging"]) == 2

    provider_a_view = await client.get(
        f"/orders/provider/{order_id}",
        params=ctx["provider_a_params"],
        headers=ctx["provider_a_headers"],
    )
    assert provider_a_view.status_code == 200
    messaging = provider_a_view.json()["messaging"]
    assert len(messaging) == 1
    assert messaging[0]["provider_organization_id"] == ctx["provider_a_id"]
    assert messaging[0]["price"]["amount"] == 400


async def test_provider_patch_other_messaging_404(
    client: AsyncClient,
    order_messaging_ctx: dict,
) -> None:
    ctx = order_messaging_ctx
    await _create_price(
        client,
        headers=ctx["provider_a_headers"],
        params=ctx["provider_a_params"],
        neighborhood_id=ctx["neighborhood_id"],
        amount=300,
    )
    await _set_accepts(
        client,
        headers=ctx["provider_b_headers"],
        params=ctx["provider_b_params"],
        accepts=True,
    )
    create = await client.post(
        "/orders/seller/",
        params=ctx["seller_params"],
        headers=ctx["seller_headers"],
        json={
            "customer_id": ctx["customer_id"],
            "items": [
                {"product_id": ctx["product_a_id"], "quantity": 1},
                {"product_id": ctx["product_b_id"], "quantity": 1},
            ],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["id"]
    messaging_id = create.json()["messaging"][0]["id"]

    r = await client.patch(
        f"/orders/provider/{order_id}/messaging/{messaging_id}",
        params=ctx["provider_b_params"],
        headers=ctx["provider_b_headers"],
        json={"price": {"amount": 1, "currency": "cup"}},
    )
    assert r.status_code == 404

    r_unknown = await client.patch(
        f"/orders/provider/{order_id}/messaging/{uuid4()}",
        params=ctx["provider_a_params"],
        headers=ctx["provider_a_headers"],
        json={"price": {"amount": 1, "currency": "cup"}},
    )
    assert r_unknown.status_code == 404
