from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.tag_factory import TagFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def provider_context(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    return {
        "user_id": user["id"],
        "organization_id": org["id"],
        "headers": bearer_headers(user_id=user["id"]),
        "params": {"organization_id": org["id"]},
    }


async def test_create_list_get_patch_delete_tag(
    client: AsyncClient,
    provider_context: dict,
) -> None:
    headers = provider_context["headers"]
    params = provider_context["params"]

    r_create = await client.post(
        "/tags/provider/",
        params=params,
        headers=headers,
        json={"name": "  Orgánico  ", "is_active": True},
    )
    assert r_create.status_code == 201
    body = r_create.json()
    assert body["name"] == "Orgánico"
    assert body["is_active"] is True
    assert body["organization_id"] == provider_context["organization_id"]
    tag_id = body["id"]

    r_list = await client.get(
        "/tags/provider/",
        params={**params, "name": "orgán"},
        headers=headers,
    )
    assert r_list.status_code == 200
    body_list = r_list.json()
    assert body_list["total"] == 1
    assert [t["id"] for t in body_list["items"]] == [tag_id]

    r_get = await client.get(
        f"/tags/provider/{tag_id}",
        params=params,
        headers=headers,
    )
    assert r_get.status_code == 200
    assert r_get.json()["name"] == "Orgánico"

    r_patch = await client.patch(
        f"/tags/provider/{tag_id}",
        params=params,
        headers=headers,
        json={"name": "Premium", "is_active": False},
    )
    assert r_patch.status_code == 200
    patched = r_patch.json()
    assert patched["name"] == "Premium"
    assert patched["is_active"] is False

    r_delete = await client.delete(
        f"/tags/provider/{tag_id}",
        params=params,
        headers=headers,
    )
    assert r_delete.status_code == 204

    r_missing = await client.get(
        f"/tags/provider/{tag_id}",
        params=params,
        headers=headers,
    )
    assert r_missing.status_code == 404


async def test_duplicate_tag_name_returns_409(
    client: AsyncClient,
    provider_context: dict,
) -> None:
    headers = provider_context["headers"]
    params = provider_context["params"]

    r1 = await client.post(
        "/tags/provider/",
        params=params,
        headers=headers,
        json={"name": "Duplicado"},
    )
    assert r1.status_code == 201

    r2 = await client.post(
        "/tags/provider/",
        params=params,
        headers=headers,
        json={"name": "Duplicado"},
    )
    assert r2.status_code == 409


async def test_provider_cannot_access_other_org_tag(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    tag_factory: TagFactory,
) -> None:
    owner = await user_factory.build()
    outsider = await user_factory.build()
    org_a = await organization_factory.build(user_id=owner["id"])
    org_b = await organization_factory.build(user_id=outsider["id"])
    tag = await tag_factory.build(organization_id=org_a["id"], name="Secret")

    r = await client.get(
        f"/tags/provider/{tag['id']}",
        params={"organization_id": org_b["id"]},
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert r.status_code == 404


async def test_provider_requires_organization_id(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    r = await client.get(
        "/tags/provider/",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 422


async def test_provider_forbidden_for_non_member(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    owner = await user_factory.build()
    outsider = await user_factory.build()
    org = await organization_factory.build(user_id=owner["id"])
    r = await client.get(
        "/tags/provider/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert r.status_code == 403


async def test_seller_org_cannot_use_provider_tag_routes(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build()
    seller_org = await organization_factory.build_seller(user_id=user["id"])
    r = await client.get(
        "/tags/provider/",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 403


async def test_get_unknown_tag_returns_404(
    client: AsyncClient,
    provider_context: dict,
) -> None:
    r = await client.get(
        f"/tags/provider/{uuid4()}",
        params=provider_context["params"],
        headers=provider_context["headers"],
    )
    assert r.status_code == 404


async def test_list_tags_is_active_filter(
    client: AsyncClient,
    provider_context: dict,
    tag_factory: TagFactory,
) -> None:
    org_id = provider_context["organization_id"]
    await tag_factory.build(organization_id=org_id, name="Activo", is_active=True)
    await tag_factory.build(organization_id=org_id, name="Inactivo", is_active=False)

    r_active = await client.get(
        "/tags/provider/",
        params={**provider_context["params"], "is_active": True},
        headers=provider_context["headers"],
    )
    assert r_active.status_code == 200
    assert [t["name"] for t in r_active.json()["items"]] == ["Activo"]

    r_inactive = await client.get(
        "/tags/provider/",
        params={**provider_context["params"], "is_active": False},
        headers=provider_context["headers"],
    )
    assert r_inactive.status_code == 200
    assert [t["name"] for t in r_inactive.json()["items"]] == ["Inactivo"]
