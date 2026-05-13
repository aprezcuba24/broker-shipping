import pytest
from httpx import AsyncClient
from uuid import uuid4

from tests.factories.product_factory import ProductFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_list_products_empty_when_no_rows(client: AsyncClient) -> None:
    r = await client.get("/products/")
    assert r.status_code == 200
    assert r.json() == []


async def test_create_product_returns_201(client: AsyncClient) -> None:
    r = await client.post("/products/", json={"name": "Ejemplo"})
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Ejemplo"
    assert body["id"]


async def test_get_product_returns_200(
    client: AsyncClient, product_factory: ProductFactory
) -> None:
    created = await product_factory.build(name="One")
    r = await client.get(f"/products/{created['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "One"


async def test_get_product_unknown_returns_404(client: AsyncClient) -> None:
    r = await client.get(f"/products/{uuid4()}")
    assert r.status_code == 404


async def test_patch_product_changes_name(
    client: AsyncClient, product_factory: ProductFactory
) -> None:
    p = await product_factory.build(name="Old")
    r = await client.patch(f"/products/{p['id']}", json={"name": "New"})
    assert r.status_code == 200
    assert r.json()["name"] == "New"


async def test_delete_product_returns_204(
    client: AsyncClient, product_factory: ProductFactory
) -> None:
    p = await product_factory.build(name="To delete")
    r = await client.delete(f"/products/{p['id']}")
    assert r.status_code == 204


async def test_get_deleted_product_returns_404(
    client: AsyncClient, product_factory: ProductFactory
) -> None:
    p = await product_factory.build()
    rid = p["id"]
    await client.delete(f"/products/{rid}")
    r = await client.get(f"/products/{rid}")
    assert r.status_code == 404
