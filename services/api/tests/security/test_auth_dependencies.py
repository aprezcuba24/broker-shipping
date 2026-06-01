import pytest
from httpx import AsyncClient
from uuid import uuid4

from tests.factories.auth_helpers import (
    api_key_headers,
    bearer_headers,
    organization_headers,
    tenant_headers,
)
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_products_require_auth(client: AsyncClient) -> None:
    assert (await client.get("/products/")).status_code == 401


async def test_products_with_jwt(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    headers = tenant_headers(user_id=u["id"], organization_id=org["id"])
    r = await client.get("/products/", headers=headers)
    assert r.status_code == 200
    assert r.json() == []


async def test_products_jwt_without_organization_header_returns_400(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    u = await user_factory.build()
    r = await client.get("/products/", headers=bearer_headers(user_id=u["id"]))
    assert r.status_code == 400
    assert r.json()["detail"] == "Organization context required"


async def test_products_jwt_non_member_organization_returns_403(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    owner = await user_factory.build(username="owner_products")
    outsider = await user_factory.build(username="outsider_products")
    org = await organization_factory.build(user_id=owner["id"])
    headers = tenant_headers(user_id=outsider["id"], organization_id=org["id"])
    r = await client.get("/products/", headers=headers)
    assert r.status_code == 403
    assert r.json()["detail"] == "Forbidden"


async def test_products_jwt_invalid_organization_header_returns_400(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    headers["X-Organization-Id"] = "not-a-uuid"
    r = await client.get("/products/", headers=headers)
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid organization id"


async def test_users_me_without_organization_header_ok(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    u = await user_factory.build()
    r = await client.get("/users/me", headers=bearer_headers(user_id=u["id"]))
    assert r.status_code == 200
    assert r.json()["id"] == u["id"]


async def test_users_me_with_valid_organization_header_ok(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    headers = {
        **bearer_headers(user_id=u["id"]),
        **organization_headers(organization_id=org["id"]),
    }
    r = await client.get("/users/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == u["id"]


async def test_users_me_with_unknown_organization_header_returns_403(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    u = await user_factory.build()
    headers = {
        **bearer_headers(user_id=u["id"]),
        **organization_headers(organization_id=uuid4()),
    }
    r = await client.get("/users/me", headers=headers)
    assert r.status_code == 403
    assert r.json()["detail"] == "Forbidden"


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

    r_list = await client.get(
        f"/organizations/{org['id']}/api-keys",
        headers=tenant_headers(user_id=u["id"], organization_id=org["id"]),
    )
    key_id = r_list.json()[0]["id"]
    await client.delete(f"/organizations/{org['id']}/api-keys/{key_id}", headers=headers)

    r = await client.get("/products/", headers=api_key_headers(raw_key=raw))
    assert r.status_code == 401


async def test_list_api_keys_provider_with_organization_header_ok(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    headers = tenant_headers(user_id=u["id"], organization_id=org["id"])

    await client.post(
        f"/organizations/{org['id']}/api-keys",
        json={"name": "list-role-test"},
        headers=bearer_headers(user_id=u["id"]),
    )

    r = await client.get(f"/organizations/{org['id']}/api-keys", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


async def test_list_api_keys_non_member_returns_403(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_list_role")
    outsider = await user_factory.build(username="outsider_list")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    r = await client.get(
        f"/organizations/{org_id}/api-keys",
        headers=tenant_headers(user_id=outsider["id"], organization_id=org_id),
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Forbidden"


async def test_seller_jwt_cannot_create_product(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    seller = await user_factory.build(username="sell_write")
    seller_org = await organization_factory.build_seller(user_id=seller["id"])
    headers = tenant_headers(user_id=seller["id"], organization_id=seller_org["id"])

    r = await client.post(
        "/products/",
        json={"name": "X", "category_id": None},
        headers=headers,
    )
    assert r.status_code == 403


async def test_provider_jwt_can_create_product(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory,
) -> None:
    u = await user_factory.build(username="prov_write")
    org = await organization_factory.build(user_id=u["id"])
    cat = await category_factory.build(organization_id=org["id"])
    headers = tenant_headers(user_id=u["id"], organization_id=org["id"])

    r = await client.post(
        "/products/",
        json={"name": "Widget", "category_id": cat["id"]},
        headers=headers,
    )
    assert r.status_code == 201


async def test_list_api_keys_without_organization_header_ok_with_path_org(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])

    await client.post(
        f"/organizations/{org['id']}/api-keys",
        json={"name": "path-org-test"},
        headers=bearer_headers(user_id=u["id"]),
    )

    r = await client.get(
        f"/organizations/{org['id']}/api-keys",
        headers=bearer_headers(user_id=u["id"]),
    )
    assert r.status_code == 200
    assert len(r.json()) == 1
