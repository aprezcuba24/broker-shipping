from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
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


async def test_create_list_get_patch_delete_product(
    client: AsyncClient,
    provider_context: dict,
) -> None:
    headers = provider_context["headers"]
    params = provider_context["params"]

    r_create = await client.post(
        "/products/provider/",
        params=params,
        headers=headers,
        json={"name": "  Arroz 1kg  "},
    )
    assert r_create.status_code == 201
    body = r_create.json()
    assert body["name"] == "Arroz 1kg"
    assert body["organization_id"] == provider_context["organization_id"]
    product_id = body["id"]

    r_list = await client.get(
        "/products/provider/",
        params={**params, "name": "arroz"},
        headers=headers,
    )
    assert r_list.status_code == 200
    assert [p["id"] for p in r_list.json()] == [product_id]

    r_get = await client.get(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
    )
    assert r_get.status_code == 200
    assert r_get.json()["name"] == "Arroz 1kg"

    r_patch = await client.patch(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
        json={"name": "Arroz premium"},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["name"] == "Arroz premium"

    r_delete = await client.delete(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
    )
    assert r_delete.status_code == 204

    r_missing = await client.get(
        f"/products/provider/{product_id}",
        params=params,
        headers=headers,
    )
    assert r_missing.status_code == 404


async def test_provider_cannot_access_other_org_product(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    owner = await user_factory.build()
    outsider = await user_factory.build()
    org_a = await organization_factory.build(user_id=owner["id"])
    org_b = await organization_factory.build(user_id=outsider["id"])
    product = await product_factory.build(
        organization_id=org_a["id"],
        name="Secret",
    )

    r = await client.get(
        f"/products/provider/{product['id']}",
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
        "/products/provider/",
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
        "/products/provider/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert r.status_code == 403


async def test_seller_org_cannot_use_provider_routes(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build()
    seller_org = await organization_factory.build_seller(user_id=user["id"])
    r = await client.get(
        "/products/provider/",
        params={"organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 403


async def test_get_unknown_product_returns_404(
    client: AsyncClient,
    provider_context: dict,
) -> None:
    r = await client.get(
        f"/products/provider/{uuid4()}",
        params=provider_context["params"],
        headers=provider_context["headers"],
    )
    assert r.status_code == 404
