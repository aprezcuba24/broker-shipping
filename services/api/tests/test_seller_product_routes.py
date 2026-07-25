from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_linked_product(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
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
    product = await product_factory.build(
        organization_id=provider_org["id"],
        name="Linked product",
    )
    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "provider_org_id": provider_org["id"],
        "product_id": product["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
    }


async def test_seller_list_without_organization_id(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        "/products/seller/",
        headers=seller_linked_product["seller_bearer"],
    )
    assert r.status_code == 200
    assert [p["name"] for p in r.json()] == ["Linked product"]


async def test_seller_list_with_organization_id(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        "/products/seller/",
        params=seller_linked_product["seller_params"],
        headers=seller_linked_product["seller_bearer"],
    )
    assert r.status_code == 200
    assert [p["name"] for p in r.json()] == ["Linked product"]


async def test_seller_get_product(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        f"/products/seller/{seller_linked_product['product_id']}",
        params=seller_linked_product["seller_params"],
        headers=seller_linked_product["seller_bearer"],
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Linked product"


async def test_seller_cannot_post_product(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.post(
        "/products/seller/",
        params=seller_linked_product["seller_params"],
        headers=seller_linked_product["seller_bearer"],
        json={"name": "X"},
    )
    assert r.status_code == 405


async def test_seller_get_unknown_returns_404(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        f"/products/seller/{uuid4()}",
        params=seller_linked_product["seller_params"],
        headers=seller_linked_product["seller_bearer"],
    )
    assert r.status_code == 404


async def test_seller_cannot_see_unlinked_provider_product(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    product = await product_factory.build(
        organization_id=provider_org["id"],
        name="Hidden",
    )
    r = await client.get(
        f"/products/seller/{product['id']}",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert r.status_code == 404


async def test_provider_org_id_on_seller_route_returns_403(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    r = await client.get(
        "/products/seller/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 403


@pytest_asyncio.fixture
async def seller_filter_context(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> dict:
    provider_a_user = await user_factory.build()
    provider_b_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider_a = await organization_factory.build(user_id=provider_a_user["id"])
    provider_b = await organization_factory.build(user_id=provider_b_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_a["id"],
        seller_organization_id=seller_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_b["id"],
        seller_organization_id=seller_org["id"],
    )
    await product_factory.build(
        organization_id=provider_a["id"],
        name="Laptop Alpha",
    )
    await product_factory.build(
        organization_id=provider_a["id"],
        name="Desktop Alpha",
    )
    await product_factory.build(
        organization_id=provider_b["id"],
        name="Laptop Beta",
    )
    return {
        "provider_a_id": provider_a["id"],
        "provider_b_id": provider_b["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
    }


async def test_seller_list_filter_by_name(
    client: AsyncClient,
    seller_filter_context: dict,
) -> None:
    r = await client.get(
        "/products/seller/",
        params={**seller_filter_context["seller_params"], "name": "lap"},
        headers=seller_filter_context["seller_bearer"],
    )
    assert r.status_code == 200
    names = sorted(p["name"] for p in r.json())
    assert names == ["Laptop Alpha", "Laptop Beta"]


async def test_seller_list_filter_by_provider_id(
    client: AsyncClient,
    seller_filter_context: dict,
) -> None:
    r = await client.get(
        "/products/seller/",
        params={
            **seller_filter_context["seller_params"],
            "provider_id": seller_filter_context["provider_a_id"],
        },
        headers=seller_filter_context["seller_bearer"],
    )
    assert r.status_code == 200
    names = sorted(p["name"] for p in r.json())
    assert names == ["Desktop Alpha", "Laptop Alpha"]


async def test_seller_filter_unauthorized_provider_returns_403(
    client: AsyncClient,
    seller_filter_context: dict,
) -> None:
    r = await client.get(
        "/products/seller/",
        params={
            **seller_filter_context["seller_params"],
            "provider_id": str(uuid4()),
        },
        headers=seller_filter_context["seller_bearer"],
    )
    assert r.status_code == 403


async def test_list_linked_providers(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        "/organizations/seller/providers",
        params=seller_linked_product["seller_params"],
        headers=seller_linked_product["seller_bearer"],
    )
    assert r.status_code == 200
    ids = [org["id"] for org in r.json()]
    assert ids == [seller_linked_product["provider_org_id"]]
