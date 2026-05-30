from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.organization.models import Organization
from tests.factories.api_key_factory import ApiKeyFactory
from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.category_factory import CategoryFactory
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_create_org_links_membership(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])

    r = await client.post("/organizations/", json={"name": "Acme"}, headers=headers)
    assert r.status_code == 201
    org_id = r.json()["id"]

    r_list = await client.get("/organizations/", headers=headers)
    assert r_list.status_code == 200
    ids = [o["id"] for o in r_list.json()]
    assert org_id in ids


async def test_api_key_create_list_revoke(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"])

    r_create = await client.post(
        f"/organizations/{org['id']}/api-keys",
        json={"name": "erp"},
        headers=headers,
    )
    assert r_create.status_code == 201
    raw = r_create.json()["raw_key"]
    assert raw.startswith("bk_")

    r_list = await client.get(
        f"/organizations/{org['id']}/api-keys",
        headers=tenant_headers(user_id=u["id"], organization_id=org["id"]),
    )
    assert r_list.status_code == 200
    keys = r_list.json()
    assert len(keys) == 1
    key_id = keys[0]["id"]

    r_del = await client.delete(
        f"/organizations/{org['id']}/api-keys/{key_id}",
        headers=headers,
    )
    assert r_del.status_code == 204


async def test_non_member_cannot_create_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    owner = await user_factory.build(username="owner1")
    outsider = await user_factory.build(username="outsider1")
    org = await organization_factory.build(user_id=owner["id"])

    r = await client.post(
        f"/organizations/{org['id']}/api-keys",
        json={"name": "x"},
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert r.status_code == 403


async def test_member_can_patch_organization_name(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"], name="Before")

    r = await client.patch(
        f"/organizations/{org['id']}",
        json={"name": "After"},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "After"


async def test_non_member_cannot_patch_or_delete_organization(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    owner = await user_factory.build(username="owner_patch")
    outsider = await user_factory.build(username="outsider_patch")
    org = await organization_factory.build(user_id=owner["id"])
    outsider_headers = bearer_headers(user_id=outsider["id"])

    r_patch = await client.patch(
        f"/organizations/{org['id']}",
        json={"name": "Hacked"},
        headers=outsider_headers,
    )
    assert r_patch.status_code == 403

    r_del = await client.delete(
        f"/organizations/{org['id']}",
        headers=outsider_headers,
    )
    assert r_del.status_code == 403


async def test_delete_organization_without_dependencies_hard_deletes(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    db_session: AsyncSession,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"])
    org_id = org["id"]

    r_del = await client.delete(f"/organizations/{org_id}", headers=headers)
    assert r_del.status_code == 204

    r_list = await client.get("/organizations/", headers=headers)
    assert org_id not in [o["id"] for o in r_list.json()]

    result = await db_session.execute(
        select(Organization).where(Organization.id == UUID(org_id)),
    )
    assert result.scalar_one_or_none() is None


async def test_delete_organization_with_api_keys_and_categories_hard_deletes(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    api_key_factory: ApiKeyFactory,
    category_factory: CategoryFactory,
    db_session: AsyncSession,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"])
    org_id = org["id"]
    await api_key_factory.build(organization_id=org_id)
    await category_factory.build(organization_id=org_id)

    r_del = await client.delete(f"/organizations/{org_id}", headers=headers)
    assert r_del.status_code == 204

    result = await db_session.execute(
        select(Organization).where(Organization.id == UUID(org_id)),
    )
    assert result.scalar_one_or_none() is None


async def test_delete_organization_with_dependencies_soft_deletes(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    db_session: AsyncSession,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"])
    org_id = org["id"]
    category = await category_factory.build(organization_id=org_id)
    await product_factory.build(organization_id=org_id, category_id=category["id"])

    r_del = await client.delete(f"/organizations/{org_id}", headers=headers)
    assert r_del.status_code == 204

    r_list = await client.get("/organizations/", headers=headers)
    assert org_id not in [o["id"] for o in r_list.json()]

    result = await db_session.execute(
        select(Organization).where(Organization.id == UUID(org_id)),
    )
    row = result.scalar_one_or_none()
    assert row is not None
    assert row.deleted_at is not None


async def test_patch_and_delete_soft_deleted_organization_returns_404(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
) -> None:
    u = await user_factory.build()
    headers = bearer_headers(user_id=u["id"])
    org = await organization_factory.build(user_id=u["id"])
    org_id = org["id"]
    category = await category_factory.build(organization_id=org_id)
    await product_factory.build(organization_id=org_id, category_id=category["id"])

    r_del = await client.delete(f"/organizations/{org_id}", headers=headers)
    assert r_del.status_code == 204

    r_patch = await client.patch(
        f"/organizations/{org_id}",
        json={"name": "Again"},
        headers=headers,
    )
    assert r_patch.status_code == 404

    r_del_again = await client.delete(f"/organizations/{org_id}", headers=headers)
    assert r_del_again.status_code == 404
