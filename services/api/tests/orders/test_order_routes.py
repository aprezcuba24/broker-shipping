import re

import pytest
import pytest_asyncio
from httpx import AsyncClient

INVOICE_CODE_PATTERN = re.compile(r"^F\d{5}$")

from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.category_factory import CategoryFactory
from tests.factories.customer_factory import CustomerFactory
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


def _address_payload() -> dict:
    return {
        "province": "La Habana",
        "municipality": "Plaza",
        "district": "Vedado",
        "neighborhood": "Centro",
        "address": "Calle 23 #100",
        "reference": "Esquina",
    }


def _customer_payload(
    *,
    phone: str = "+53555123456",
    identification: str = "ID-ORDER-1",
) -> dict:
    return {
        "name": "Test Customer",
        "phone": phone,
        "identification": identification,
    }


def _order_payload_inline_customer(
    *,
    product_id: str,
    price: int,
    quantity: int = 2,
    phone: str = "+53555123456",
    identification: str = "ID-ORDER-1",
) -> dict:
    return {
        "customer": _customer_payload(phone=phone, identification=identification),
        "address": _address_payload(),
        "lines": [{"product_id": product_id, "quantity": quantity, "price": price}],
    }


async def test_create_order_inline_customer_persists_snapshots_and_totals(
    client: AsyncClient,
    seller_with_provider_product: dict,
) -> None:
    ctx = seller_with_provider_product
    quantity = 3
    line_price = ctx["product_price"] + 500

    r = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=ctx["product_id"],
            price=line_price,
            quantity=quantity,
        ),
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 201
    body = r.json()
    assert INVOICE_CODE_PATTERN.match(body["name"])
    assert body["seller"]["id"] == ctx["seller_org_id"]
    assert body["customer_snapshot"]["phone"] == "+53555123456"
    assert body["customer_snapshot"]["identification"] == "ID-ORDER-1"
    assert body["address_snapshot"]["province"] == "La Habana"
    assert body["customer_id"] == body["customer_snapshot"]["customer_id"]

    assert len(body["lines"]) == 1
    line = body["lines"][0]
    assert line["product_price"] == ctx["product_price"]
    assert line["price"] == line_price
    assert body["product_price"] == ctx["product_price"] * quantity
    assert body["price"] == line_price * quantity


async def test_create_order_with_existing_customer_and_address_id(
    client: AsyncClient,
    seller_with_provider_product: dict,
    customer_factory: CustomerFactory,
) -> None:
    ctx = seller_with_provider_product
    data = await customer_factory.build_with_address(
        organization_id=ctx["seller_org_id"],
        phone="+53555999999",
        identification="ID-EXISTING",
    )

    r = await client.post(
        "/orders/",
        json={
            "customer_id": data["customer"]["id"],
            "address_id": data["address"]["id"],
            "lines": [
                {
                    "product_id": ctx["product_id"],
                    "quantity": 1,
                    "price": ctx["product_price"],
                },
            ],
        },
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 201
    body = r.json()
    assert body["customer_id"] == data["customer"]["id"]
    assert body["customer_snapshot"]["name"] == data["customer"]["name"]
    assert body["address_snapshot"]["address_id"] == data["address"]["id"]


async def test_create_order_with_existing_customer_and_new_address(
    client: AsyncClient,
    db_session,
    seller_with_provider_product: dict,
    customer_factory: CustomerFactory,
) -> None:
    ctx = seller_with_provider_product
    data = await customer_factory.build_with_address(
        organization_id=ctx["seller_org_id"],
        phone="+53555888888",
        identification="ID-ADDR-UPDATE",
    )
    old_address_id = data["address"]["id"]

    r = await client.post(
        "/orders/",
        json={
            "customer_id": data["customer"]["id"],
            "address": {
                "province": "Matanzas",
                "municipality": "Cardenas",
                "district": "Centro",
                "neighborhood": "Norte",
                "address": "Avenida 1",
                "reference": None,
            },
            "lines": [
                {
                    "product_id": ctx["product_id"],
                    "quantity": 1,
                    "price": ctx["product_price"],
                },
            ],
        },
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 201
    body = r.json()
    assert body["address_snapshot"]["province"] == "Matanzas"
    assert body["address_snapshot"]["address_id"] != old_address_id


async def test_create_order_rejects_duplicate_phone_or_identification(
    client: AsyncClient,
    seller_with_provider_product: dict,
    customer_factory: CustomerFactory,
) -> None:
    ctx = seller_with_provider_product
    await customer_factory.build(
        organization_id=ctx["seller_org_id"],
        phone="+53555777777",
        identification="ID-UNIQUE",
    )

    r_phone = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=ctx["product_id"],
            price=ctx["product_price"],
            phone="+53555777777",
            identification="ID-OTHER",
        ),
        headers=ctx["seller_headers"],
    )
    assert r_phone.status_code == 400
    assert "customer_id" in r_phone.json()["detail"]

    r_id = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=ctx["product_id"],
            price=ctx["product_price"],
            phone="+53555666666",
            identification="ID-UNIQUE",
        ),
        headers=ctx["seller_headers"],
    )
    assert r_id.status_code == 400


async def test_create_order_rejects_price_below_product_price(
    client: AsyncClient,
    seller_with_provider_product: dict,
) -> None:
    ctx = seller_with_provider_product
    r = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
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
            "customer": _customer_payload(
                phone="+53555987654",
                identification="ID-MULTI",
            ),
            "address": _address_payload(),
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
    assert body_b["product_price"] == 1000 * 3
    assert body_b["price"] == 1500 * 3


async def test_create_order_assigns_incremental_invoice_codes_per_seller(
    client: AsyncClient,
    seller_with_provider_product: dict,
) -> None:
    ctx = seller_with_provider_product

    r_first = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=ctx["product_id"],
            price=ctx["product_price"],
            phone="+53555111111",
            identification="ID-SEQ-1",
        ),
        headers=ctx["seller_headers"],
    )
    assert r_first.status_code == 201
    first_code = r_first.json()["name"]
    assert INVOICE_CODE_PATTERN.match(first_code)

    r_second = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=ctx["product_id"],
            price=ctx["product_price"],
            phone="+53555222222",
            identification="ID-SEQ-2",
        ),
        headers=ctx["seller_headers"],
    )
    assert r_second.status_code == 201
    second_code = r_second.json()["name"]
    assert int(second_code[1:]) == int(first_code[1:]) + 1


async def test_different_sellers_can_share_invoice_code_with_distinct_seller_ref(
    client: AsyncClient,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
) -> None:
    provider_user = await user_factory.build(username="order_dup_prov")
    seller_a_user = await user_factory.build(username="order_dup_sell_a")
    seller_b_user = await user_factory.build(username="order_dup_sell_b")
    provider_org = await organization_factory.build(
        user_id=provider_user["id"],
        name="Provider Dup",
    )
    seller_a_org = await organization_factory.build_seller(
        user_id=seller_a_user["id"],
        name="Seller Alpha",
    )
    seller_b_org = await organization_factory.build_seller(
        user_id=seller_b_user["id"],
        name="Seller Beta",
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_org["id"],
        seller_organization_id=seller_a_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_org["id"],
        seller_organization_id=seller_b_org["id"],
    )
    category = await category_factory.build(organization_id=provider_org["id"])
    product = await product_factory.build(
        organization_id=provider_org["id"],
        category_id=category["id"],
        price=2500,
    )
    seller_a_headers = tenant_headers(
        user_id=seller_a_user["id"],
        organization_id=seller_a_org["id"],
    )
    seller_b_headers = tenant_headers(
        user_id=seller_b_user["id"],
        organization_id=seller_b_org["id"],
    )
    provider_headers = tenant_headers(
        user_id=provider_user["id"],
        organization_id=provider_org["id"],
    )

    r_first = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=product["id"],
            price=product["price"],
            phone="+53555333333",
            identification="ID-DUP-A",
        ),
        headers=seller_a_headers,
    )
    assert r_first.status_code == 201
    first_body = r_first.json()

    r_second = await client.post(
        "/orders/",
        json=_order_payload_inline_customer(
            product_id=product["id"],
            price=product["price"],
            phone="+53555444444",
            identification="ID-DUP-B",
        ),
        headers=seller_b_headers,
    )
    assert r_second.status_code == 201
    second_body = r_second.json()

    assert first_body["name"] == "F00001"
    assert second_body["name"] == "F00001"
    assert first_body["seller"]["name"] == "Seller Alpha"
    assert second_body["seller"]["name"] == "Seller Beta"

    r_provider = await client.get("/orders/", headers=provider_headers)
    assert r_provider.status_code == 200
    provider_orders = r_provider.json()
    matching = [order for order in provider_orders if order["name"] == "F00001"]
    seller_names = {order["seller"]["name"] for order in matching}
    assert seller_names == {"Seller Alpha", "Seller Beta"}
