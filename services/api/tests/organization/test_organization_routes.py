import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
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

    r_list = await client.get(f"/organizations/{org['id']}/api-keys", headers=headers)
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
