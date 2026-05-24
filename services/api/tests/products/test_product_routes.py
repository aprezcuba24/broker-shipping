import pytest
import pytest_asyncio
from httpx import AsyncClient
from uuid import uuid4

from tests.factories.auth_helpers import tenant_headers
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory
from tests.factories.organization_factory import OrganizationFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def auth_headers(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict[str, str]:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    return tenant_headers(user_id=u["id"], organization_id=org["id"])


async def test_list_products_empty_when_no_rows(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    r = await client.get("/products/", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []


async def test_create_product_returns_201(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    r = await client.post("/products/", json={"name": "Ejemplo"}, headers=auth_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Ejemplo"
    assert body["id"]


async def test_get_product_returns_200(
    client: AsyncClient,
    product_factory: ProductFactory,
    auth_headers: dict[str, str],
) -> None:
    created = await product_factory.build(name="One")
    r = await client.get(f"/products/{created['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "One"


async def test_get_product_unknown_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    r = await client.get(f"/products/{uuid4()}", headers=auth_headers)
    assert r.status_code == 404


async def test_patch_product_changes_name(
    client: AsyncClient,
    product_factory: ProductFactory,
    auth_headers: dict[str, str],
) -> None:
    p = await product_factory.build(name="Old")
    r = await client.patch(f"/products/{p['id']}", json={"name": "New"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "New"


async def test_delete_product_returns_204(
    client: AsyncClient,
    product_factory: ProductFactory,
    auth_headers: dict[str, str],
) -> None:
    p = await product_factory.build(name="To delete")
    r = await client.delete(f"/products/{p['id']}", headers=auth_headers)
    assert r.status_code == 204


async def test_get_deleted_product_returns_404(
    client: AsyncClient,
    product_factory: ProductFactory,
    auth_headers: dict[str, str],
) -> None:
    p = await product_factory.build()
    rid = p["id"]
    await client.delete(f"/products/{rid}", headers=auth_headers)
    r = await client.get(f"/products/{rid}", headers=auth_headers)
    assert r.status_code == 404
