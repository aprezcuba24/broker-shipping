import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import api_key_headers, bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_products_require_auth(client: AsyncClient) -> None:
    assert (await client.get("/products/")).status_code == 401


async def test_products_with_jwt(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    r = await client.get("/products/", headers=headers)
    assert r.status_code == 200
    assert r.json() == []


async def test_products_with_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    api_key_factory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    raw, _meta = await api_key_factory.build(organization_id=org["id"])
    r = await client.get("/products/", headers=api_key_headers(raw_key=raw))
    assert r.status_code == 200


async def test_revoked_api_key_rejected(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    api_key_factory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"])
    raw, _meta = await api_key_factory.build(organization_id=org["id"])

    r_list = await client.get(f"/organizations/{org['id']}/api-keys", headers=headers)
    key_id = r_list.json()[0]["id"]
    await client.delete(f"/organizations/{org['id']}/api-keys/{key_id}", headers=headers)

    r = await client.get("/products/", headers=api_key_headers(raw_key=raw))
    assert r.status_code == 401


async def test_admin_recent_requires_user_not_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    api_key_factory,
    product_factory: ProductFactory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    raw, _ = await api_key_factory.build(organization_id=org["id"])
    await product_factory.build(name="P1")

    r_key = await client.get("/products/admin/recent", headers=api_key_headers(raw_key=raw))
    assert r_key.status_code == 401

    r_user = await client.get("/products/admin/recent", headers=bearer_headers(user_id=u["id"]))
    assert r_user.status_code == 200
    assert isinstance(r_user.json(), list)


async def test_sync_requires_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    api_key_factory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    raw, _ = await api_key_factory.build(organization_id=org["id"])

    r_bad = await client.post("/products/sync", headers=bearer_headers(user_id=u["id"]))
    assert r_bad.status_code == 401

    r_ok = await client.post("/products/sync", headers=api_key_headers(raw_key=raw))
    assert r_ok.status_code == 200
    assert r_ok.json()["organization_id"] == org["id"]
