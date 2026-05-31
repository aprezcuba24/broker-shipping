import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_invite_seller_accept_by_token(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_seller")
    seller = await user_factory.build(username="sell_token")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    r_inv = await client.post(
        f"/organizations/{org_id}/invitations",
        json={"role": "seller"},
        headers=bearer_headers(user_id=provider["id"]),
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    r_acc = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["role"] == "seller"
    assert r_acc.json()["is_active"] is True

    r_prod = await client.get(
        "/products/",
        headers=tenant_headers(user_id=seller["id"], organization_id=org_id),
    )
    assert r_prod.status_code == 200


async def test_invite_provider_second_provider_can_manage_api_keys(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    p1 = await user_factory.build(username="prov_one")
    p2 = await user_factory.build(username="prov_two")
    org = await organization_factory.build(user_id=p1["id"])
    org_id = org["id"]

    r_inv = await client.post(
        f"/organizations/{org_id}/invitations",
        json={"role": "provider"},
        headers=bearer_headers(user_id=p1["id"]),
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    r_acc = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=p2["id"]),
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["role"] == "provider"

    r_key = await client.post(
        f"/organizations/{org_id}/api-keys",
        json={"name": "p2-key"},
        headers=bearer_headers(user_id=p2["id"]),
    )
    assert r_key.status_code == 201


async def test_seller_request_accepted_by_provider(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_req")
    seller = await user_factory.build(username="sell_req")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    r_req = await client.post(
        f"/organizations/{org_id}/join-requests",
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_req.status_code == 201
    inv_id = r_req.json()["id"]

    r_acc = await client.post(
        f"/organizations/invitations/{inv_id}/accept",
        headers=bearer_headers(user_id=provider["id"]),
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["role"] == "seller"


async def test_deactivated_seller_cannot_access_tenant(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_deact")
    seller = await user_factory.build(username="sell_deact")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    r_inv = await client.post(
        f"/organizations/{org_id}/invitations",
        json={"role": "seller"},
        headers=bearer_headers(user_id=provider["id"]),
    )
    token = r_inv.json()["token"]
    await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller["id"]),
    )

    r_patch = await client.patch(
        f"/organizations/{org_id}/members/{seller['id']}",
        json={"is_active": False},
        headers=bearer_headers(user_id=provider["id"]),
    )
    assert r_patch.status_code == 200

    r_prod = await client.get(
        "/products/",
        headers=tenant_headers(user_id=seller["id"], organization_id=org_id),
    )
    assert r_prod.status_code == 403


async def test_seller_cannot_create_invitation_or_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_guard")
    seller = await user_factory.build(username="sell_guard")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    r_inv = await client.post(
        f"/organizations/{org_id}/invitations",
        json={"role": "seller"},
        headers=bearer_headers(user_id=provider["id"]),
    )
    token = r_inv.json()["token"]
    await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller["id"]),
    )

    r_inv2 = await client.post(
        f"/organizations/{org_id}/invitations",
        json={"role": "seller"},
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_inv2.status_code == 403

    r_key = await client.post(
        f"/organizations/{org_id}/api-keys",
        json={"name": "x"},
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_key.status_code == 403


async def test_seller_cannot_patch_organization(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_patch2")
    seller = await user_factory.build(username="sell_patch2")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    r_inv = await client.post(
        f"/organizations/{org_id}/invitations",
        json={"role": "seller"},
        headers=bearer_headers(user_id=provider["id"]),
    )
    token = r_inv.json()["token"]
    await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller["id"]),
    )

    r_patch = await client.patch(
        f"/organizations/{org_id}",
        json={"name": "Hacked"},
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_patch.status_code == 403
