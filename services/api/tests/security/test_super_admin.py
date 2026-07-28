from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models.organization.enums import OrganizationType
from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_super_admin_me_and_my_organizations_empty(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    other = await user_factory.build()
    await organization_factory.build(user_id=other["id"])
    headers = bearer_headers(user_id=admin["id"])

    r_me = await client.get("/users/me", headers=headers)
    assert r_me.status_code == 200
    body = r_me.json()
    assert body["is_super_admin"] is True
    assert body["id"] == admin["id"]

    r_orgs = await client.get("/users/my-organizations", headers=headers)
    assert r_orgs.status_code == 200
    assert r_orgs.json() == []


async def test_normal_user_me_is_not_super_admin(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    r = await client.get("/users/me", headers=bearer_headers(user_id=user["id"]))
    assert r.status_code == 200
    assert r.json()["is_super_admin"] is False


async def test_super_admin_provider_crud_without_membership(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    owner = await user_factory.build()
    org = await organization_factory.build(user_id=owner["id"])
    headers = bearer_headers(user_id=admin["id"])
    params = {"organization_id": org["id"]}

    r_create = await client.post(
        "/products/provider/",
        params=params,
        headers=headers,
        json={"name": "Admin product"},
    )
    assert r_create.status_code == 201
    product_id = r_create.json()["id"]

    r_list = await client.get(
        "/products/provider/",
        params=params,
        headers=headers,
    )
    assert r_list.status_code == 200
    assert r_list.json()["total"] == 1

    r_get = await client.get(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
    )
    assert r_get.status_code == 200
    assert r_get.json()["name"] == "Admin product"

    r_patch = await client.patch(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
        json={"name": "Admin product updated"},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["name"] == "Admin product updated"

    r_delete = await client.delete(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
    )
    assert r_delete.status_code == 204


async def test_normal_user_without_membership_forbidden(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    owner = await user_factory.build()
    outsider = await user_factory.build()
    org = await organization_factory.build(user_id=owner["id"])

    r = await client.get(
        "/products/provider/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert r.status_code == 403


async def test_super_admin_seller_catalog_without_links(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    owner = await user_factory.build()
    provider_org = await organization_factory.build(user_id=owner["id"])
    product = await product_factory.build(
        organization_id=provider_org["id"],
        name="Unlinked product",
    )

    r = await client.get(
        "/products/seller/",
        headers=bearer_headers(user_id=admin["id"]),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == product["id"]


async def test_super_admin_cannot_create_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    r = await client.post(
        "/users/me/api-keys/",
        headers=bearer_headers(user_id=admin["id"]),
        json={"name": "should fail"},
    )
    assert r.status_code == 403
    assert "Super admins cannot create API keys" in r.json()["detail"]


async def test_super_admin_seller_org_on_provider_route_forbidden(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    owner = await user_factory.build()
    seller_org = await organization_factory.build(
        user_id=owner["id"],
        org_type=OrganizationType.seller,
    )

    r = await client.get(
        "/products/provider/",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=admin["id"]),
    )
    assert r.status_code == 403


async def test_super_admin_unknown_org_returns_404(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    r = await client.get(
        "/products/provider/",
        params={"organization_id": str(uuid4())},
        headers=bearer_headers(user_id=admin["id"]),
    )
    assert r.status_code == 404
