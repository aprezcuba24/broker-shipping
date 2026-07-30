from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.tag_factory import TagFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_linked_tag(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    tag_factory: TagFactory,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_org["id"],
        seller_organization_id=seller_org["id"],
    )
    tag = await tag_factory.build(
        organization_id=provider_org["id"],
        name="Linked tag",
        is_active=True,
    )
    inactive = await tag_factory.build(
        organization_id=provider_org["id"],
        name="Inactive tag",
        is_active=False,
    )
    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "provider_org_id": provider_org["id"],
        "tag_id": tag["id"],
        "inactive_tag_id": inactive["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
    }


async def test_seller_list_tags(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.get(
        "/tags/seller/",
        params=seller_linked_tag["seller_params"],
        headers=seller_linked_tag["seller_bearer"],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert [t["name"] for t in body["items"]] == ["Linked tag"]


async def test_seller_get_tag(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.get(
        f"/tags/seller/{seller_linked_tag['tag_id']}",
        params=seller_linked_tag["seller_params"],
        headers=seller_linked_tag["seller_bearer"],
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Linked tag"


async def test_seller_cannot_get_inactive_tag(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.get(
        f"/tags/seller/{seller_linked_tag['inactive_tag_id']}",
        params=seller_linked_tag["seller_params"],
        headers=seller_linked_tag["seller_bearer"],
    )
    assert r.status_code == 404


async def test_seller_cannot_post_tag(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.post(
        "/tags/seller/",
        params=seller_linked_tag["seller_params"],
        headers=seller_linked_tag["seller_bearer"],
        json={"name": "X"},
    )
    assert r.status_code == 405


async def test_seller_without_link_gets_empty_list(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    seller_user = await user_factory.build()
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    r = await client.get(
        "/tags/seller/",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert r.status_code == 200
    assert r.json()["total"] == 0


async def test_seller_unauthorized_provider_id_returns_403(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.get(
        "/tags/seller/",
        params={
            **seller_linked_tag["seller_params"],
            "provider_id": str(uuid4()),
        },
        headers=seller_linked_tag["seller_bearer"],
    )
    assert r.status_code == 403


async def test_seller_requires_organization_id(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.get(
        "/tags/seller/",
        headers=seller_linked_tag["seller_bearer"],
    )
    assert r.status_code == 422


async def test_seller_get_unknown_tag_returns_404(
    client: AsyncClient,
    seller_linked_tag: dict,
) -> None:
    r = await client.get(
        f"/tags/seller/{uuid4()}",
        params=seller_linked_tag["seller_params"],
        headers=seller_linked_tag["seller_bearer"],
    )
    assert r.status_code == 404
