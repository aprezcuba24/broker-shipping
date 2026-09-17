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
async def movement_ctx(
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


async def _get_product(client: AsyncClient, ctx: dict, product_id: str) -> dict:
    r = await client.get(
        f"/products/provider/{product_id}",
        params=ctx["params"],
        headers=ctx["headers"],
    )
    assert r.status_code == 200
    return r.json()


async def test_create_list_get_reception_increases_stock(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    moved_at = "2026-09-15T14:30:00"
    r_create = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "moved_at": moved_at,
            "notes": "Carga inicial",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 10},
                {"product_id": movement_ctx["product_b_id"], "quantity": 3},
            ],
        },
    )
    assert r_create.status_code == 201
    body = r_create.json()
    assert body["organization_id"] == movement_ctx["organization_id"]
    assert body["kind"] == "reception"
    assert body["direction"] == "in"
    assert body["notes"] == "Carga inicial"
    assert body["moved_at"].startswith("2026-09-15T14:30:00")
    assert len(body["items"]) == 2
    by_product = {item["product_id"]: item for item in body["items"]}
    assert by_product[movement_ctx["product_a_id"]]["quantity"] == 10
    assert by_product[movement_ctx["product_b_id"]]["quantity"] == 3
    movement_id = body["id"]

    product_a = await _get_product(client, movement_ctx, movement_ctx["product_a_id"])
    assert product_a["stock"] == 10
    assert product_a["reserved"] == 0

    product_b = await _get_product(client, movement_ctx, movement_ctx["product_b_id"])
    assert product_b["stock"] == 8
    assert product_b["reserved"] == 0

    r_list = await client.get(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
    )
    assert r_list.status_code == 200
    listed = r_list.json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == movement_id
    assert len(listed["items"][0]["items"]) == 2

    r_get = await client.get(
        f"/product-stock-movements/provider/{movement_id}",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["id"] == movement_id


async def test_create_movement_defaults_moved_at(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    before = datetime.now(timezone.utc).replace(tzinfo=None)
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 201
    moved_at = datetime.fromisoformat(r.json()["moved_at"])
    assert moved_at >= before


async def test_shrinkage_decreases_stock(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "shrinkage",
            "notes": "Rotura",
            "items": [
                {"product_id": movement_ctx["product_b_id"], "quantity": 2},
            ],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["kind"] == "shrinkage"
    assert body["direction"] == "out"

    product_b = await _get_product(client, movement_ctx, movement_ctx["product_b_id"])
    assert product_b["stock"] == 3
    assert product_b["reserved"] == 0


async def test_correction_in_and_out(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r_in = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "correction",
            "direction": "in",
            "notes": "Faltaban unidades",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 4},
            ],
        },
    )
    assert r_in.status_code == 201
    assert r_in.json()["direction"] == "in"
    product_a = await _get_product(client, movement_ctx, movement_ctx["product_a_id"])
    assert product_a["stock"] == 4

    r_out = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "correction",
            "direction": "out",
            "notes": "Sobró en recepción",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r_out.status_code == 201
    assert r_out.json()["direction"] == "out"
    product_a = await _get_product(client, movement_ctx, movement_ctx["product_a_id"])
    assert product_a["stock"] == 3


async def test_out_movement_insufficient_stock_is_409(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "shrinkage",
            "items": [
                {"product_id": movement_ctx["product_b_id"], "quantity": 6},
            ],
        },
    )
    assert r.status_code == 409
    product_b = await _get_product(client, movement_ctx, movement_ctx["product_b_id"])
    assert product_b["stock"] == 5


async def test_correction_requires_direction(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "correction",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 422


async def test_reception_rejects_direction(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "direction": "in",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 422


async def test_create_movement_rejects_duplicate_product(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
                {"product_id": movement_ctx["product_a_id"], "quantity": 2},
            ],
        },
    )
    assert r.status_code == 422


async def test_create_movement_rejects_foreign_product(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "items": [
                {"product_id": movement_ctx["other_product_id"], "quantity": 1},
            ],
        },
    )
    assert r.status_code == 404


async def test_create_movement_rejects_unknown_product(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "items": [
                {"product_id": str(uuid4()), "quantity": 1},
            ],
        },
    )
    assert r.status_code == 404


async def test_movement_cross_tenant_get_is_404(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r_create = await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )
    assert r_create.status_code == 201
    movement_id = r_create.json()["id"]

    r_get = await client.get(
        f"/product-stock-movements/provider/{movement_id}",
        params=movement_ctx["other_params"],
        headers=movement_ctx["other_headers"],
    )
    assert r_get.status_code == 404


async def test_list_movements_filter_by_kind(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "reception",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 5},
            ],
        },
    )
    await client.post(
        "/product-stock-movements/provider/",
        params=movement_ctx["params"],
        headers=movement_ctx["headers"],
        json={
            "kind": "shrinkage",
            "items": [
                {"product_id": movement_ctx["product_a_id"], "quantity": 1},
            ],
        },
    )

    r = await client.get(
        "/product-stock-movements/provider/",
        params={**movement_ctx["params"], "kind": "shrinkage"},
        headers=movement_ctx["headers"],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["kind"] == "shrinkage"


async def test_movement_requires_organization_id(
    client: AsyncClient,
    movement_ctx: dict,
) -> None:
    r = await client.get(
        "/product-stock-movements/provider/",
        headers=movement_ctx["headers"],
    )
    assert r.status_code == 422
