import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _accept_seller_invite(
    client: AsyncClient,
    *,
    provider_user_id: str,
    seller_user_id: str,
    provider_org_id: str,
) -> str:
    r_inv = await client.post(
        f"/organizations/{provider_org_id}/seller-invitations",
        headers=bearer_headers(user_id=provider_user_id),
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    r_acc = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller_user_id),
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["is_active"] is True
    return r_acc.json()["organization_id"]


async def test_seller_invite_accept_by_token(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_seller")
    seller = await user_factory.build(username="sell_token")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    seller_org_id = await _accept_seller_invite(
        client,
        provider_user_id=provider["id"],
        seller_user_id=seller["id"],
        provider_org_id=org_id,
    )

    r_prod = await client.get(
        "/products/seller/",
        headers=tenant_headers(user_id=seller["id"], organization_id=seller_org_id),
    )
    assert r_prod.status_code == 200


async def test_member_invite_second_provider_staff_can_manage_api_keys(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    p1 = await user_factory.build(username="prov_one")
    p2 = await user_factory.build(username="prov_two")
    org = await organization_factory.build(user_id=p1["id"])
    org_id = org["id"]

    r_inv = await client.post(
        f"/organizations/{org_id}/member-invitations",
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

    r_key = await client.post(
        f"/organizations/{org_id}/api-keys",
        json={"name": "p2-key"},
        headers=bearer_headers(user_id=p2["id"]),
    )
    assert r_key.status_code == 201


async def test_member_invite_to_seller_org(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    owner = await user_factory.build(username="sell_owner")
    colleague = await user_factory.build(username="sell_colleague")
    seller_org = await organization_factory.build_seller(user_id=owner["id"])

    r_inv = await client.post(
        f"/organizations/{seller_org['id']}/member-invitations",
        headers=bearer_headers(user_id=owner["id"]),
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    r_acc = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=colleague["id"]),
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["organization_id"] == seller_org["id"]


async def test_seller_join_request_accepted_by_provider(
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
        f"/organizations/{org_id}/invitations/{inv_id}/accept",
        headers=bearer_headers(user_id=provider["id"]),
    )
    assert r_acc.status_code == 200
    assert r_acc.json()["is_active"] is True


async def test_deactivated_seller_link_cannot_access_products(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_deact")
    seller = await user_factory.build(username="sell_deact")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    seller_org_id = await _accept_seller_invite(
        client,
        provider_user_id=provider["id"],
        seller_user_id=seller["id"],
        provider_org_id=org_id,
    )

    r_list = await client.get(
        f"/organizations/{org_id}/linked-sellers",
        headers=bearer_headers(user_id=provider["id"]),
    )
    assert r_list.status_code == 200
    assert len(r_list.json()) == 1

    r_patch = await client.patch(
        f"/organizations/{org_id}/linked-sellers/{seller_org_id}",
        json={"is_active": False},
        headers=bearer_headers(user_id=provider["id"]),
    )
    assert r_patch.status_code == 204

    r_prod = await client.get(
        "/products/seller/",
        headers=tenant_headers(user_id=seller["id"], organization_id=seller_org_id),
    )
    assert r_prod.status_code == 200
    assert r_prod.json() == []


async def test_seller_org_cannot_create_seller_invite_or_provider_api_key(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_guard")
    seller = await user_factory.build(username="sell_guard")
    provider_org = await organization_factory.build(user_id=provider["id"])
    seller_org = await organization_factory.build_seller(user_id=seller["id"])

    r_seller_inv = await client.post(
        f"/organizations/{seller_org['id']}/seller-invitations",
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_seller_inv.status_code == 403

    r_key = await client.post(
        f"/organizations/{provider_org['id']}/api-keys",
        json={"name": "x"},
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_key.status_code == 403


async def test_seller_member_cannot_patch_provider_organization(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    provider = await user_factory.build(username="prov_patch2")
    seller = await user_factory.build(username="sell_patch2")
    org = await organization_factory.build(user_id=provider["id"])
    org_id = org["id"]

    await _accept_seller_invite(
        client,
        provider_user_id=provider["id"],
        seller_user_id=seller["id"],
        provider_org_id=org_id,
    )

    r_patch = await client.patch(
        f"/organizations/{org_id}",
        json={"name": "Hacked"},
        headers=bearer_headers(user_id=seller["id"]),
    )
    assert r_patch.status_code == 403
