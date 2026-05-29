import pytest
import pytest_asyncio
from httpx import AsyncClient
from uuid import uuid4

from tests.factories.auth_helpers import api_key_headers, tenant_headers
from tests.factories.category_factory import CategoryFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory
from tests.factories.organization_factory import OrganizationFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def tenant_context(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    u = await user_factory.build()
    org = await organization_factory.build(user_id=u["id"])
    return {
        "user_id": u["id"],
        "organization_id": org["id"],
        "headers": tenant_headers(user_id=u["id"], organization_id=org["id"]),
    }


async def test_list_categories_empty_when_no_rows(
    client: AsyncClient,
    tenant_context: dict,
) -> None:
    r = await client.get("/products/categories/", headers=tenant_context["headers"])
    assert r.status_code == 200
    assert r.json() == []


async def test_create_category_returns_201_with_organization(
    client: AsyncClient,
    tenant_context: dict,
) -> None:
    r = await client.post(
        "/products/categories/",
        json={"name": "Electronics"},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Electronics"
    assert body["organization_id"] == tenant_context["organization_id"]


async def test_get_category_returns_200(
    client: AsyncClient,
    category_factory: CategoryFactory,
    tenant_context: dict,
) -> None:
    created = await category_factory.build(
        organization_id=tenant_context["organization_id"],
        name="Books",
    )
    r = await client.get(
        f"/products/categories/{created['id']}",
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Books"


async def test_patch_category_changes_name(
    client: AsyncClient,
    category_factory: CategoryFactory,
    tenant_context: dict,
) -> None:
    c = await category_factory.build(
        organization_id=tenant_context["organization_id"],
        name="Old",
    )
    r = await client.patch(
        f"/products/categories/{c['id']}",
        json={"name": "New"},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    assert r.json()["name"] == "New"


async def test_delete_category_returns_204(
    client: AsyncClient,
    category_factory: CategoryFactory,
    tenant_context: dict,
) -> None:
    c = await category_factory.build(organization_id=tenant_context["organization_id"])
    r = await client.delete(
        f"/products/categories/{c['id']}",
        headers=tenant_context["headers"],
    )
    assert r.status_code == 204


async def test_delete_category_with_products_returns_400(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
    )
    r = await client.delete(
        f"/products/categories/{category['id']}",
        headers=tenant_context["headers"],
    )
    assert r.status_code == 400


async def test_category_from_other_organization_not_visible(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
) -> None:
    owner = await user_factory.build(username="owner_cat_iso")
    outsider = await user_factory.build(username="outsider_cat_iso")
    org_a = await organization_factory.build(user_id=owner["id"], name="Cat Org A")
    org_b = await organization_factory.build(user_id=outsider["id"], name="Cat Org B")
    category = await category_factory.build(organization_id=org_b["id"], name="Secret Cat")

    headers_a = tenant_headers(user_id=owner["id"], organization_id=org_a["id"])
    r_list = await client.get("/products/categories/", headers=headers_a)
    assert r_list.status_code == 200
    assert r_list.json() == []

    r_get = await client.get(
        f"/products/categories/{category['id']}",
        headers=headers_a,
    )
    assert r_get.status_code == 404


async def test_api_key_only_sees_own_organization_categories(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    api_key_factory,
) -> None:
    u = await user_factory.build()
    org_a = await organization_factory.build(user_id=u["id"], name="Cat Key A")
    org_b = await organization_factory.build(user_id=u["id"], name="Cat Key B")
    await category_factory.build(organization_id=org_a["id"], name="Visible Cat")
    await category_factory.build(organization_id=org_b["id"], name="Hidden Cat")
    raw, _meta = await api_key_factory.build(organization_id=org_a["id"])

    r = await client.get("/products/categories/", headers=api_key_headers(raw_key=raw))
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert names == ["Visible Cat"]
