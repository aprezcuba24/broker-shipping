from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.services.order.helpers import derive_order_status
from app.services.order.item_status import can_transition
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
async def provider_order_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    customer_factory: CustomerFactory,
    client: AsyncClient,
) -> dict:
    provider_a_user = await user_factory.build()
    provider_b_user = await user_factory.build()
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()

    provider_a = await organization_factory.build(
        user_id=provider_a_user["id"],
        name="Provider A",
    )
    provider_b = await organization_factory.build(
        user_id=provider_b_user["id"],
        name="Provider B",
    )
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )

    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_a["id"],
        seller_organization_id=seller_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_b["id"],
        seller_organization_id=seller_org["id"],
    )

    product_a = await product_factory.build(
        organization_id=provider_a["id"],
        name="Product A",
        currency=Currency.cup,
        commission=100,
    )
    product_b = await product_factory.build(
        organization_id=provider_b["id"],
        name="Product B",
        currency=Currency.usd,
        commission=200,
    )
    customer = await customer_factory.build(
        seller_organization_id=seller_org["id"],
        name="Maria Garcia",
        ci="85010112345",
        phone="55123456",
    )

    create = await client.post(
        "/orders/seller/",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
        json={
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product_a["id"],
                    "quantity": 2,
                    "seller_provider_price": 1000,
                },
                {
                    "product_id": product_b["id"],
                    "quantity": 1,
                    "seller_provider_price": 2000,
                },
            ],
        },
    )
    assert create.status_code == 201
    order = create.json()

    return {
        "provider_a_user_id": provider_a_user["id"],
        "provider_b_user_id": provider_b_user["id"],
        "provider_a_id": provider_a["id"],
        "provider_b_id": provider_b["id"],
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "other_seller_user_id": other_seller_user["id"],
        "other_seller_org_id": other_seller_org["id"],
        "product_a_id": product_a["id"],
        "product_b_id": product_b["id"],
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "customer_ci": customer["ci"],
        "customer_phone": customer["phone"],
        "order_id": order["id"],
        "order_code": order["code"],
        "provider_a_bearer": bearer_headers(user_id=provider_a_user["id"]),
        "provider_b_bearer": bearer_headers(user_id=provider_b_user["id"]),
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "provider_a_params": {"organization_id": provider_a["id"]},
        "provider_b_params": {"organization_id": provider_b["id"]},
        "seller_params": {"organization_id": seller_org["id"]},
    }


def test_can_transition_rules() -> None:
    assert can_transition(OrderItemStatus.created, OrderItemStatus.reviewed)
    assert can_transition(OrderItemStatus.reviewed, OrderItemStatus.sent)
    assert can_transition(OrderItemStatus.sent, OrderItemStatus.delivered)
    assert can_transition(OrderItemStatus.created, OrderItemStatus.canceled)
    assert can_transition(OrderItemStatus.reviewed, OrderItemStatus.canceled)
    assert can_transition(OrderItemStatus.sent, OrderItemStatus.canceled)
    assert can_transition(OrderItemStatus.created, OrderItemStatus.created)
    assert not can_transition(OrderItemStatus.created, OrderItemStatus.sent)
    assert not can_transition(OrderItemStatus.delivered, OrderItemStatus.reviewed)
    assert not can_transition(OrderItemStatus.canceled, OrderItemStatus.created)
    assert not can_transition(OrderItemStatus.delivered, OrderItemStatus.canceled)


def test_derive_order_status() -> None:
    from types import SimpleNamespace

    def items(*statuses: OrderItemStatus) -> list:
        return [SimpleNamespace(status=status) for status in statuses]

    assert derive_order_status(items(OrderItemStatus.created)) == OrderStatus.created
    assert (
        derive_order_status(
            items(OrderItemStatus.created, OrderItemStatus.reviewed)
        )
        == OrderStatus.processing
    )
    assert (
        derive_order_status(items(OrderItemStatus.sent, OrderItemStatus.created))
        == OrderStatus.processing
    )
    assert (
        derive_order_status(
            items(OrderItemStatus.delivered, OrderItemStatus.canceled)
        )
        == OrderStatus.finished
    )
    assert (
        derive_order_status(
            items(OrderItemStatus.canceled, OrderItemStatus.canceled)
        )
        == OrderStatus.canceled
    )


async def test_provider_list_and_get_filters_own_items(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    listed = await client.get(
        "/orders/provider/",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert listed.status_code == 200
    page = listed.json()
    assert page["total"] == 1
    assert page["items"][0]["id"] == provider_order_ctx["order_id"]
    assert len(page["items"][0]["items"]) == 1
    assert page["items"][0]["items"][0]["product_id"] == provider_order_ctx["product_a_id"]
    assert page["items"][0]["totals"] == [{"currency": "cup", "amount": 2000}]
    assert page["items"][0]["customer"]["name"] == provider_order_ctx["customer_name"]
    assert page["items"][0]["customer"]["ci"] == provider_order_ctx["customer_ci"]
    assert page["items"][0]["customer"]["phone"] == provider_order_ctx["customer_phone"]

    detail = await client.get(
        f"/orders/provider/{provider_order_ctx['order_id']}",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert detail.status_code == 200
    body = detail.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["provider_organization_id"] == provider_order_ctx[
        "provider_a_id"
    ]
    assert body["totals"] == [{"currency": "cup", "amount": 2000}]
    assert body["customer"]["name"] == provider_order_ctx["customer_name"]
    assert body["customer"]["ci"] == provider_order_ctx["customer_ci"]
    assert body["customer"]["phone"] == provider_order_ctx["customer_phone"]


async def test_provider_list_orders_search_by_code_name_phone_ci(
    client: AsyncClient,
    provider_order_ctx: dict,
    customer_factory: CustomerFactory,
) -> None:
    other_customer = await customer_factory.build(
        seller_organization_id=provider_order_ctx["seller_org_id"],
        name="Pedro Lopez",
        ci="99010199999",
        phone="55999999",
    )
    other_order = await client.post(
        "/orders/seller/",
        params=provider_order_ctx["seller_params"],
        headers=provider_order_ctx["seller_bearer"],
        json={
            "customer_id": other_customer["id"],
            "items": [
                {
                    "product_id": provider_order_ctx["product_a_id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                },
            ],
        },
    )
    assert other_order.status_code == 201

    by_code = await client.get(
        "/orders/provider/",
        params={
            **provider_order_ctx["provider_a_params"],
            "search": provider_order_ctx["order_code"],
        },
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert by_code.status_code == 200
    assert by_code.json()["total"] == 1
    assert by_code.json()["items"][0]["code"] == provider_order_ctx["order_code"]

    by_name = await client.get(
        "/orders/provider/",
        params={**provider_order_ctx["provider_a_params"], "search": "Maria"},
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert by_name.status_code == 200
    assert by_name.json()["total"] == 1
    assert by_name.json()["items"][0]["customer"]["name"] == "Maria Garcia"

    by_phone = await client.get(
        "/orders/provider/",
        params={**provider_order_ctx["provider_a_params"], "search": "55123456"},
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert by_phone.status_code == 200
    assert by_phone.json()["total"] == 1
    assert by_phone.json()["items"][0]["customer"]["phone"] == "55123456"

    by_ci = await client.get(
        "/orders/provider/",
        params={**provider_order_ctx["provider_a_params"], "search": "85010112345"},
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert by_ci.status_code == 200
    assert by_ci.json()["total"] == 1
    assert by_ci.json()["items"][0]["customer"]["ci"] == "85010112345"


async def test_provider_list_orders_filter_by_status(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    created_id = provider_order_ctx["order_id"]

    processing_order = await client.post(
        "/orders/seller/",
        params=provider_order_ctx["seller_params"],
        headers=provider_order_ctx["seller_bearer"],
        json={
            "customer_id": provider_order_ctx["customer_id"],
            "items": [
                {
                    "product_id": provider_order_ctx["product_a_id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                },
            ],
        },
    )
    assert processing_order.status_code == 201
    processing_id = processing_order.json()["id"]

    reviewed = await client.patch(
        f"/orders/provider/{processing_id}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "reviewed"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "processing"

    by_created = await client.get(
        "/orders/provider/",
        params={**provider_order_ctx["provider_a_params"], "status": "created"},
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert by_created.status_code == 200
    assert by_created.json()["total"] == 1
    assert by_created.json()["items"][0]["id"] == created_id

    by_processing = await client.get(
        "/orders/provider/",
        params={**provider_order_ctx["provider_a_params"], "status": "processing"},
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert by_processing.status_code == 200
    assert by_processing.json()["total"] == 1
    assert by_processing.json()["items"][0]["id"] == processing_id

    all_orders = await client.get(
        "/orders/provider/",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert all_orders.status_code == 200
    assert all_orders.json()["total"] == 2


async def test_provider_without_items_cannot_see_order(
    client: AsyncClient,
    provider_order_ctx: dict,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider_c_user = await user_factory.build()
    provider_c = await organization_factory.build(user_id=provider_c_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_c["id"],
        seller_organization_id=provider_order_ctx["seller_org_id"],
    )

    listed = await client.get(
        "/orders/provider/",
        params={"organization_id": provider_c["id"]},
        headers=bearer_headers(user_id=provider_c_user["id"]),
    )
    assert listed.status_code == 200
    assert listed.json()["total"] == 0

    detail = await client.get(
        f"/orders/provider/{provider_order_ctx['order_id']}",
        params={"organization_id": provider_c["id"]},
        headers=bearer_headers(user_id=provider_c_user["id"]),
    )
    assert detail.status_code == 404


async def test_provider_patch_advances_items_and_order_status(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    r = await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "reviewed"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "processing"
    assert all(item["status"] == "reviewed" for item in body["items"])
    assert len(body["items"]) == 1

    seller_view = await client.get(
        f"/orders/seller/{provider_order_ctx['order_id']}",
        params=provider_order_ctx["seller_params"],
        headers=provider_order_ctx["seller_bearer"],
    )
    assert seller_view.status_code == 200
    seller_body = seller_view.json()
    assert seller_body["status"] == "processing"
    by_product = {item["product_id"]: item for item in seller_body["items"]}
    assert by_product[provider_order_ctx["product_a_id"]]["status"] == "reviewed"
    assert by_product[provider_order_ctx["product_b_id"]]["status"] == "created"


async def test_provider_cancel_items(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    r = await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "canceled"},
    )
    assert r.status_code == 200
    assert r.json()["items"][0]["status"] == "canceled"
    # Provider B item still created → order is not fully canceled
    assert r.json()["status"] == "processing"


async def test_provider_rejects_invalid_transitions(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "reviewed"},
    )
    await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "sent"},
    )
    delivered = await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "delivered"},
    )
    assert delivered.status_code == 200

    invalid = await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "reviewed"},
    )
    assert invalid.status_code == 422

    cancel_delivered = await client.patch(
        f"/orders/provider/{provider_order_ctx['order_id']}/items",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
        json={"status": "canceled"},
    )
    assert cancel_delivered.status_code == 422


async def test_order_finished_when_all_items_terminal(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    for provider_key in ("provider_a", "provider_b"):
        for status in ("reviewed", "sent", "delivered"):
            r = await client.patch(
                f"/orders/provider/{provider_order_ctx['order_id']}/items",
                params=provider_order_ctx[f"{provider_key}_params"],
                headers=provider_order_ctx[f"{provider_key}_bearer"],
                json={"status": status},
            )
            assert r.status_code == 200, r.text

    seller_view = await client.get(
        f"/orders/seller/{provider_order_ctx['order_id']}",
        params=provider_order_ctx["seller_params"],
        headers=provider_order_ctx["seller_bearer"],
    )
    assert seller_view.status_code == 200
    assert seller_view.json()["status"] == "finished"


async def test_order_canceled_when_all_items_canceled(
    client: AsyncClient,
    provider_order_ctx: dict,
) -> None:
    for provider_key in ("provider_a", "provider_b"):
        r = await client.patch(
            f"/orders/provider/{provider_order_ctx['order_id']}/items",
            params=provider_order_ctx[f"{provider_key}_params"],
            headers=provider_order_ctx[f"{provider_key}_bearer"],
            json={"status": "canceled"},
        )
        assert r.status_code == 200

    seller_view = await client.get(
        f"/orders/seller/{provider_order_ctx['order_id']}",
        params=provider_order_ctx["seller_params"],
        headers=provider_order_ctx["seller_bearer"],
    )
    assert seller_view.json()["status"] == "canceled"


async def test_provider_forbidden_and_validation(
    client: AsyncClient,
    provider_order_ctx: dict,
    user_factory: UserFactory,
) -> None:
    outsider = await user_factory.build()
    forbidden = await client.get(
        "/orders/provider/",
        params=provider_order_ctx["provider_a_params"],
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert forbidden.status_code == 403

    seller_as_provider = await client.get(
        "/orders/provider/",
        params=provider_order_ctx["seller_params"],
        headers=provider_order_ctx["seller_bearer"],
    )
    assert seller_as_provider.status_code == 403

    missing_org = await client.get(
        "/orders/provider/",
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert missing_org.status_code == 422

    unknown = await client.get(
        f"/orders/provider/{uuid4()}",
        params=provider_order_ctx["provider_a_params"],
        headers=provider_order_ctx["provider_a_bearer"],
    )
    assert unknown.status_code == 404
