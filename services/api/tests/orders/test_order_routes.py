import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.category_factory import CategoryFactory
from tests.factories.organization_factory import OrganizationFactory, link_provider_to_seller
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _accept_seller_invite(
    client: AsyncClient,
    *,
    provider_user_id: str,
    seller_user_id: str,
    provider_org_id: str,
) -> str:
    r_inv = await client.post(
        f"/organizations/{provider_org_id}/seller-invitations",
        headers=bearer_headers(user_id=provider_user_id),
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    r_acc = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller_user_id),
    )
    assert r_acc.status_code == 200
    return r_acc.json()["organization_id"]


@pytest_asyncio.fixture
async def seller_with_provider_product(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
) -> dict:
    provider_user = await user_factory.build(username="order_prov")
    seller_user = await user_factory.build(username="order_sell")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org_id = await _accept_seller_invite(
        client,
        provider_user_id=provider_user["id"],
        seller_user_id=seller_user["id"],
        provider_org_id=provider_org["id"],
    )
    category = await category_factory.build(organization_id=provider_org["id"])
    product = await product_factory.build(
        organization_id=provider_org["id"],
        category_id=category["id"],
        price=2500,
    )
    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org_id,
        "provider_org_id": provider_org["id"],
        "provider_org_name": provider_org["name"],
        "provider_user_id": provider_user["id"],
        "product_id": product["id"],
        "product_price": product["price"],
        "seller_headers": tenant_headers(
            user_id=seller_user["id"],
            organization_id=seller_org_id,
        ),
        "provider_headers": tenant_headers(
            user_id=provider_user["id"],
            organization_id=provider_org["id"],
        ),
    }


def _order_payload(*, product_id: str, price: int, quantity: int = 2) -> dict:
    return {
        "name": "Test order",
        "customer_phone": "+53555123456",
        "lines": [{"product_id": product_id, "quantity": quantity, "price": price}],
    }


async def test_create_order_persists_line_prices_and_order_totals(
    client: AsyncClient,
    seller_with_provider_product: dict,
) -> None:
    ctx = seller_with_provider_product
    quantity = 3
    line_price = ctx["product_price"] + 500

    r = await client.post(
        "/orders/",
        json=_order_payload(
            product_id=ctx["product_id"],
            price=line_price,
            quantity=quantity,
        ),
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 201
    body = r.json()
    assert len(body["lines"]) == 1
    line = body["lines"][0]
    assert line["product_price"] == ctx["product_price"]
    assert line["price"] == line_price
    assert line["organization_id"] == ctx["provider_org_id"]
    assert line["organization"]["id"] == ctx["provider_org_id"]
    assert line["organization"]["name"] == ctx["provider_org_name"]
    assert body["product_price"] == ctx["product_price"] * quantity
    assert body["price"] == line_price * quantity


async def test_create_order_rejects_price_below_product_price(
    client: AsyncClient,
    seller_with_provider_product: dict,
) -> None:
    ctx = seller_with_provider_product
    r = await client.post(
        "/orders/",
        json=_order_payload(
            product_id=ctx["product_id"],
            price=ctx["product_price"] - 1,
        ),
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 422
    assert "greater than or equal to product price" in r.json()["detail"]


async def test_provider_order_totals_only_include_visible_lines(
    client: AsyncClient,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    seller_with_provider_product: dict,
) -> None:
    ctx = seller_with_provider_product

    provider_b_user = await user_factory.build(username="order_prov_b")
    provider_b_org = await organization_factory.build(user_id=provider_b_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_b_org["id"],
        seller_organization_id=ctx["seller_org_id"],
    )
    category_b = await category_factory.build(organization_id=provider_b_org["id"])
    product_b = await product_factory.build(
        organization_id=provider_b_org["id"],
        category_id=category_b["id"],
        price=1000,
    )

    r = await client.post(
        "/orders/",
        json={
            "name": "Multi-provider order",
            "customer_phone": "+53555987654",
            "lines": [
                {
                    "product_id": ctx["product_id"],
                    "quantity": 2,
                    "price": ctx["product_price"],
                },
                {
                    "product_id": product_b["id"],
                    "quantity": 3,
                    "price": 1500,
                },
            ],
        },
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 201
    order_id = r.json()["id"]
    seller_body = r.json()
    assert seller_body["product_price"] == ctx["product_price"] * 2 + 1000 * 3
    assert seller_body["price"] == ctx["product_price"] * 2 + 1500 * 3

    r_provider_a = await client.get(
        f"/orders/{order_id}",
        headers=ctx["provider_headers"],
    )
    assert r_provider_a.status_code == 200
    body_a = r_provider_a.json()
    assert len(body_a["lines"]) == 1
    line_a = body_a["lines"][0]
    assert line_a["organization_id"] == ctx["provider_org_id"]
    assert line_a["organization"]["id"] == ctx["provider_org_id"]
    assert line_a["organization"]["name"] == ctx["provider_org_name"]
    assert body_a["product_price"] == ctx["product_price"] * 2
    assert body_a["price"] == ctx["product_price"] * 2

    provider_b_headers = tenant_headers(
        user_id=provider_b_user["id"],
        organization_id=provider_b_org["id"],
    )
    r_provider_b = await client.get(
        f"/orders/{order_id}",
        headers=provider_b_headers,
    )
    assert r_provider_b.status_code == 200
    body_b = r_provider_b.json()
    assert len(body_b["lines"]) == 1
    line_b = body_b["lines"][0]
    assert line_b["organization_id"] == provider_b_org["id"]
    assert line_b["organization"]["id"] == provider_b_org["id"]
    assert line_b["organization"]["name"] == provider_b_org["name"]
    assert body_b["product_price"] == 1000 * 3
    assert body_b["price"] == 1500 * 3
