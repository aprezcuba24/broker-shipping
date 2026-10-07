import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.facebook_group_factory import FacebookGroupFactory
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_context(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    user = await user_factory.build()
    org = await organization_factory.build_seller(user_id=user["id"])
    return {
        "user_id": user["id"],
        "organization_id": org["id"],
        "headers": bearer_headers(user_id=user["id"]),
        "params": {"organization_id": org["id"]},
    }


async def test_create_list_get_patch_delete_facebook_group(
    client: AsyncClient,
    seller_context: dict,
) -> None:
    r_create = await client.post(
        "/facebook/groups/",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"name": "Grupo Central", "facebook_id": "111222333"},
    )
    assert r_create.status_code == 201
    created = r_create.json()
    assert created["name"] == "Grupo Central"
    assert created["facebook_id"] == (
        "https://www.facebook.com/groups/111222333"
    )
    assert created["organization_id"] == seller_context["organization_id"]
    group_id = created["id"]

    r_list = await client.get(
        "/facebook/groups/",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_list.status_code == 200
    assert r_list.json()["total"] == 1
    assert r_list.json()["items"][0]["id"] == group_id

    r_get = await client.get(
        f"/facebook/groups/{group_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["name"] == "Grupo Central"

    r_patch = await client.patch(
        f"/facebook/groups/{group_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"name": "Grupo Renombrado"},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["name"] == "Grupo Renombrado"
    assert r_patch.json()["facebook_id"] == (
        "https://www.facebook.com/groups/111222333"
    )

    r_delete = await client.delete(
        f"/facebook/groups/{group_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_delete.status_code == 204

    r_missing = await client.get(
        f"/facebook/groups/{group_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_missing.status_code == 404


async def test_create_facebook_group_extracts_id_from_url(
    client: AsyncClient,
    seller_context: dict,
) -> None:
    r = await client.post(
        "/facebook/groups/",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={
            "name": "Desde URL",
            "facebook_id": "https://www.facebook.com/groups/1090187050273078",
        },
    )
    assert r.status_code == 201
    assert r.json()["facebook_id"] == (
        "https://www.facebook.com/groups/1090187050273078"
    )


async def test_patch_facebook_group_extracts_id_from_url(
    client: AsyncClient,
    seller_context: dict,
    facebook_group_factory: FacebookGroupFactory,
) -> None:
    group = await facebook_group_factory.build(
        organization_id=seller_context["organization_id"],
        facebook_id="111",
    )
    r = await client.patch(
        f"/facebook/groups/{group['id']}",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={
            "facebook_id": "https://www.facebook.com/groups/1090187050273078/?ref=share",
        },
    )
    assert r.status_code == 200
    assert r.json()["facebook_id"] == (
        "https://www.facebook.com/groups/1090187050273078"
    )


async def test_provider_org_forbidden(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=user["id"])
    r = await client.get(
        "/facebook/groups/",
        headers=bearer_headers(user_id=user["id"]),
        params={"organization_id": provider_org["id"]},
    )
    assert r.status_code == 403


async def test_missing_organization_id_returns_422(
    client: AsyncClient,
    seller_context: dict,
) -> None:
    r = await client.get(
        "/facebook/groups/",
        headers=seller_context["headers"],
    )
    assert r.status_code == 422


async def test_other_org_group_not_found(
    client: AsyncClient,
    seller_context: dict,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    facebook_group_factory: FacebookGroupFactory,
) -> None:
    other_user = await user_factory.build()
    other_org = await organization_factory.build_seller(user_id=other_user["id"])
    group = await facebook_group_factory.build(organization_id=other_org["id"])

    r = await client.get(
        f"/facebook/groups/{group['id']}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r.status_code == 404


async def test_list_filter_by_name(
    client: AsyncClient,
    seller_context: dict,
    facebook_group_factory: FacebookGroupFactory,
) -> None:
    await facebook_group_factory.build(
        organization_id=seller_context["organization_id"],
        name="Alpha Group",
    )
    await facebook_group_factory.build(
        organization_id=seller_context["organization_id"],
        name="Beta Group",
    )
    r = await client.get(
        "/facebook/groups/",
        headers=seller_context["headers"],
        params={**seller_context["params"], "name": "alpha"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Alpha Group"
