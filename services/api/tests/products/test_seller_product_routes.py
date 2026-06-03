import pytest
import pytest_asyncio
from httpx import AsyncClient
from uuid import uuid4

from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.category_factory import CategoryFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory
from tests.factories.organization_factory import OrganizationFactory

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
async def seller_linked_product(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
) -> dict:
    provider_user = await user_factory.build(username="sell_list_prov")
    seller_user = await user_factory.build(username="sell_list_sell")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org_id = await _accept_seller_invite(
        client,
        provider_user_id=provider_user["id"],
        seller_user_id=seller_user["id"],
        provider_org_id=provider_org["id"],
    )
    category = await category_factory.build(organization_id=provider_org["id"])
    product = await product_factory.build(
        organization_id=provider_org["id"],
        category_id=category["id"],
        name="Linked product",
    )
    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org_id,
        "product_id": product["id"],
        "seller_headers": tenant_headers(
            user_id=seller_user["id"],
            organization_id=seller_org_id,
        ),
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
    }


async def test_seller_list_without_organization_header(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        "/products/seller/",
        headers=seller_linked_product["seller_bearer"],
    )
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["Linked product"]


async def test_seller_get_without_organization_header(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        f"/products/seller/{seller_linked_product['product_id']}",
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
        json={"name": "X"},
        headers=seller_linked_product["seller_headers"],
    )
    assert r.status_code == 405


async def test_seller_get_unknown_returns_404(
    client: AsyncClient,
    seller_linked_product: dict,
) -> None:
    r = await client.get(
        f"/products/seller/{uuid4()}",
        headers=seller_linked_product["seller_headers"],
    )
    assert r.status_code == 404


async def test_provider_jwt_cannot_list_seller_products(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build(username="prov_sell_route")
    org = await organization_factory.build(user_id=u["id"])
    headers = tenant_headers(user_id=u["id"], organization_id=org["id"])
    r = await client.get("/products/seller/", headers=headers)
    assert r.status_code == 403
