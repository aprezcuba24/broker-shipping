import pytest
import pytest_asyncio
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
    return r_acc.json()["organization_id"]


@pytest_asyncio.fixture
async def seller_with_linked_provider(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    provider_user = await user_factory.build(username="sell_prov_list")
    seller_user = await user_factory.build(username="sell_prov_sell")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org_id = await _accept_seller_invite(
        client,
        provider_user_id=provider_user["id"],
        seller_user_id=seller_user["id"],
        provider_org_id=provider_org["id"],
    )
    return {
        "provider_org_id": provider_org["id"],
        "provider_org_name": provider_org["name"],
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org_id,
        "seller_headers": tenant_headers(
            user_id=seller_user["id"],
            organization_id=seller_org_id,
        ),
    }


async def test_seller_lists_linked_providers(
    client: AsyncClient,
    seller_with_linked_provider: dict,
) -> None:
    r = await client.get(
        "/organizations/seller/providers",
        headers=seller_with_linked_provider["seller_headers"],
    )
    assert r.status_code == 200
    providers = r.json()
    assert len(providers) == 1
    assert providers[0]["id"] == seller_with_linked_provider["provider_org_id"]
    assert providers[0]["name"] == seller_with_linked_provider["provider_org_name"]
    assert providers[0]["type"] == "provider"


async def test_seller_without_links_returns_empty_list(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    seller_user = await user_factory.build(username="sell_no_links")
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    headers = tenant_headers(user_id=seller_user["id"], organization_id=seller_org["id"])

    r = await client.get("/organizations/seller/providers", headers=headers)
    assert r.status_code == 200
    assert r.json() == []


async def test_missing_organization_header_returns_400(
    client: AsyncClient,
    seller_with_linked_provider: dict,
) -> None:
    r = await client.get(
        "/organizations/seller/providers",
        headers=bearer_headers(user_id=seller_with_linked_provider["seller_user_id"]),
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Organization context required"


async def test_foreign_seller_organization_returns_403(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    seller_a = await user_factory.build(username="sell_a")
    seller_b = await user_factory.build(username="sell_b")
    org_a = await organization_factory.build_seller(user_id=seller_a["id"])
    await organization_factory.build_seller(user_id=seller_b["id"])

    r = await client.get(
        "/organizations/seller/providers",
        headers=tenant_headers(user_id=seller_b["id"], organization_id=org_a["id"]),
    )
    assert r.status_code == 403


async def test_provider_organization_in_header_returns_403(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    seller_user = await user_factory.build(username="sell_wrong_type")
    provider_org = await organization_factory.build(user_id=seller_user["id"])
    headers = tenant_headers(user_id=seller_user["id"], organization_id=provider_org["id"])

    r = await client.get("/organizations/seller/providers", headers=headers)
    assert r.status_code == 403


async def test_unauthenticated_returns_401(client: AsyncClient) -> None:
    r = await client.get("/organizations/seller/providers")
    assert r.status_code == 401
