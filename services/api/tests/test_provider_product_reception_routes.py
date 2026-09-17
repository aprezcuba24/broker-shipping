from datetime import datetime, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def reception_ctx(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> dict:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    other_user = await user_factory.build()
    other_org = await organization_factory.build(user_id=other_user["id"])
    product_a = await product_factory.build(
        organization_id=org["id"],
        name="Arroz",
        stock=0,
    )
    product_b = await product_factory.build(
        organization_id=org["id"],
        name="Aceite",
        stock=5,
    )
    other_product = await product_factory.build(
        organization_id=other_org["id"],
        name="Other",
        stock=0,
    )
    return {
        "user_id": user["id"],
        "organization_id": org["id"],
        "other_organization_id": other_org["id"],
        "product_a_id": product_a["id"],
        "product_b_id": product_b["id"],
        "other_product_id": other_product["id"],
        "headers": bearer_headers(user_id=user["id"]),
        "other_headers": bearer_headers(user_id=other_user["id"]),
        "params": {"organization_id": org["id"]},
        "other_params": {"organization_id": other_org["id"]},
    }


async def test_create_list_get_reception_increases_stock(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    received_at = "2026-09-15T14:30:00"
    r_create = await client.post(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
        json={
            "received_at": received_at,
            "items": [
                {"product_id": reception_ctx["product_a_id"], "quantity": 10},
                {"product_id": reception_ctx["product_b_id"], "quantity": 3},
            ],
        },
    )
    assert r_create.status_code == 201
    body = r_create.json()
    assert body["organization_id"] == reception_ctx["organization_id"]
    assert body["received_at"].startswith("2026-09-15T14:30:00")
    assert len(body["items"]) == 2
    by_product = {item["product_id"]: item for item in body["items"]}
    assert by_product[reception_ctx["product_a_id"]]["quantity"] == 10
    assert by_product[reception_ctx["product_b_id"]]["quantity"] == 3
    reception_id = body["id"]

    r_a = await client.get(
        f"/products/provider/{reception_ctx['product_a_id']}",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
    )
    assert r_a.status_code == 200
    assert r_a.json()["stock"] == 10
    assert r_a.json()["reserved"] == 0

    r_b = await client.get(
        f"/products/provider/{reception_ctx['product_b_id']}",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
    )
    assert r_b.status_code == 200
    assert r_b.json()["stock"] == 8
    assert r_b.json()["reserved"] == 0

    r_list = await client.get(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
    )
    assert r_list.status_code == 200
    listed = r_list.json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == reception_id
    assert len(listed["items"][0]["items"]) == 2

    r_get = await client.get(
        f"/product-receptions/provider/{reception_id}",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["id"] == reception_id


async def test_create_reception_defaults_received_at(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    before = datetime.now(timezone.utc).replace(tzinfo=None)
    r = await client.post(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
        json={
            "items": [
                {"product_id": reception_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 201
    received_at = datetime.fromisoformat(r.json()["received_at"])
    assert received_at >= before


async def test_create_reception_rejects_duplicate_product(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    r = await client.post(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
        json={
            "items": [
                {"product_id": reception_ctx["product_a_id"], "quantity": 1},
                {"product_id": reception_ctx["product_a_id"], "quantity": 2},
            ],
        },
    )
    assert r.status_code == 422


async def test_create_reception_rejects_foreign_product(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    r = await client.post(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
        json={
            "items": [
                {"product_id": reception_ctx["other_product_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 404


async def test_create_reception_rejects_unknown_product(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    r = await client.post(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
        json={
            "items": [
                {"product_id": str(uuid4()), "quantity": 1},
            ],
        },
    )
    assert r.status_code == 404


async def test_reception_cross_tenant_get_is_404(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    r_create = await client.post(
        "/product-receptions/provider/",
        params=reception_ctx["params"],
        headers=reception_ctx["headers"],
        json={
            "items": [
                {"product_id": reception_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r_create.status_code == 201
    reception_id = r_create.json()["id"]

    r_get = await client.get(
        f"/product-receptions/provider/{reception_id}",
        params=reception_ctx["other_params"],
        headers=reception_ctx["other_headers"],
    )
    assert r_get.status_code == 404


async def test_reception_requires_organization_id(
    client: AsyncClient,
    reception_ctx: dict,
) -> None:
    r = await client.get(
        "/product-receptions/provider/",
        headers=reception_ctx["headers"],
    )
    assert r.status_code == 422
