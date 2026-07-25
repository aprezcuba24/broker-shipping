from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.factories.api_key_factory import ApiKeyFactory
from tests.factories.auth_helpers import api_key_headers, bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_create_list_revoke_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    r_create = await client.post(
        "/users/me/api-keys/",
        headers=headers,
        json={"name": "  CI key  ", "description": "  for tests  "},
    )
    assert r_create.status_code == 201
    created = r_create.json()
    assert created["name"] == "CI key"
    assert created["description"] == "for tests"
    assert created["created_by_user_id"] == user["id"]
    assert "raw_key" in created
    assert created["raw_key"].startswith("bk_")
    assert "secret_hash" not in created
    key_id = created["id"]
    raw_key = created["raw_key"]

    r_list = await client.get("/users/me/api-keys/", headers=headers)
    assert r_list.status_code == 200
    items = r_list.json()
    assert len(items) == 1
    assert items[0]["id"] == key_id
    assert "raw_key" not in items[0]
    assert "secret_hash" not in items[0]

    r_me = await client.get("/users/me", headers=api_key_headers(raw_key=raw_key))
    assert r_me.status_code == 200
    assert r_me.json()["id"] == user["id"]

    r_revoke = await client.delete(f"/users/me/api-keys/{key_id}", headers=headers)
    assert r_revoke.status_code == 204

    r_me_revoked = await client.get(
        "/users/me",
        headers=api_key_headers(raw_key=raw_key),
    )
    assert r_me_revoked.status_code == 401


async def test_manage_api_keys_requires_jwt(
    client: AsyncClient,
    user_factory: UserFactory,
    api_key_factory: ApiKeyFactory,
) -> None:
    user = await user_factory.build()
    raw, _meta = await api_key_factory.build(user_id=user["id"])
    headers = api_key_headers(raw_key=raw)

    r_create = await client.post(
        "/users/me/api-keys/",
        headers=headers,
        json={"name": "should fail"},
    )
    assert r_create.status_code == 403

    r_list = await client.get("/users/me/api-keys/", headers=headers)
    assert r_list.status_code == 403


async def test_api_key_accesses_provider_products(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    api_key_factory: ApiKeyFactory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    product = await product_factory.build(organization_id=org["id"], name="Arroz")
    raw, _meta = await api_key_factory.build(user_id=user["id"])
    headers = api_key_headers(raw_key=raw)
    params = {"organization_id": org["id"]}

    r_list = await client.get(
        "/products/provider/",
        params=params,
        headers=headers,
    )
    assert r_list.status_code == 200
    assert r_list.json()["total"] == 1
    assert r_list.json()["items"][0]["id"] == product["id"]

    r_get = await client.get(
        f"/products/provider/{product['id']}",
        params=params,
        headers=headers,
    )
    assert r_get.status_code == 200
    assert r_get.json()["name"] == "Arroz"


async def test_api_key_without_membership_forbidden(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    api_key_factory: ApiKeyFactory,
) -> None:
    owner = await user_factory.build()
    outsider = await user_factory.build()
    org = await organization_factory.build(user_id=owner["id"])
    raw, _meta = await api_key_factory.build(user_id=outsider["id"])

    r = await client.get(
        "/products/provider/",
        params={"organization_id": org["id"]},
        headers=api_key_headers(raw_key=raw),
    )
    assert r.status_code == 403


async def test_invalid_or_missing_api_key_returns_401(
    client: AsyncClient,
) -> None:
    r_missing = await client.get("/users/me")
    assert r_missing.status_code == 401

    r_invalid = await client.get(
        "/users/me",
        headers=api_key_headers(raw_key="bk_aaaaaaaaaaaa_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
    )
    assert r_invalid.status_code == 401


async def test_revoke_other_users_key_returns_404(
    client: AsyncClient,
    user_factory: UserFactory,
    api_key_factory: ApiKeyFactory,
) -> None:
    owner = await user_factory.build()
    other = await user_factory.build()
    _raw, meta = await api_key_factory.build(user_id=owner["id"])

    r = await client.delete(
        f"/users/me/api-keys/{meta['id']}",
        headers=bearer_headers(user_id=other["id"]),
    )
    assert r.status_code == 404


async def test_revoke_unknown_key_returns_404(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    r = await client.delete(
        f"/users/me/api-keys/{uuid4()}",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 404
