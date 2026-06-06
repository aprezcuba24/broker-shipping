import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.category_factory import CategoryFactory
from tests.factories.user_factory import UserFactory
from tests.factories.organization_factory import OrganizationFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def provider_with_categories(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
) -> dict:
    provider_user = await user_factory.build(username="sell_cat_prov")
    seller_user = await user_factory.build(username="sell_cat_sell")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    cat_a = await category_factory.build(
        organization_id=provider_org["id"],
        name="Electronics",
    )
    cat_b = await category_factory.build(
        organization_id=provider_org["id"],
        name="Books",
    )
    return {
        "provider_org_id": provider_org["id"],
        "seller_user_id": seller_user["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "category_ids": {cat_a["id"], cat_b["id"]},
        "category_names": {"Electronics", "Books"},
    }


async def test_seller_lists_categories_for_provider(
    client: AsyncClient,
    provider_with_categories: dict,
) -> None:
    r = await client.get(
        f"/products/seller/categories/{provider_with_categories['provider_org_id']}",
        headers=provider_with_categories["seller_bearer"],
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 2
    assert {c["id"] for c in body} == provider_with_categories["category_ids"]
    assert {c["name"] for c in body} == provider_with_categories["category_names"]
    assert all(
        c["organization_id"] == provider_with_categories["provider_org_id"]
        for c in body
    )


async def test_seller_list_empty_when_provider_has_no_categories(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build(username="sell_cat_empty")
    provider_org = await organization_factory.build(user_id=user["id"])
    r = await client.get(
        f"/products/seller/categories/{provider_org['id']}",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 200
    assert r.json() == []


async def test_seller_list_does_not_include_other_provider_categories(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
) -> None:
    user = await user_factory.build(username="sell_cat_iso")
    provider_a = await organization_factory.build(user_id=user["id"])
    provider_b = await organization_factory.build(user_id=user["id"])
    await category_factory.build(organization_id=provider_a["id"], name="Only A")
    await category_factory.build(organization_id=provider_b["id"], name="Only B")

    r = await client.get(
        f"/products/seller/categories/{provider_a['id']}",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert names == ["Only A"]


async def test_seller_without_provider_link_can_still_list_categories(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
) -> None:
    provider_user = await user_factory.build(username="sell_cat_unlinked_prov")
    unlinked_seller = await user_factory.build(username="sell_cat_unlinked_sell")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    await organization_factory.build_seller(user_id=unlinked_seller["id"])
    await category_factory.build(organization_id=provider_org["id"], name="Visible")

    r = await client.get(
        f"/products/seller/categories/{provider_org['id']}",
        headers=bearer_headers(user_id=unlinked_seller["id"]),
    )
    assert r.status_code == 200
    assert [c["name"] for c in r.json()] == ["Visible"]


async def test_unauthenticated_returns_401(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build(username="sell_cat_401")
    provider_org = await organization_factory.build(user_id=user["id"])
    r = await client.get(f"/products/seller/categories/{provider_org['id']}")
    assert r.status_code == 401
