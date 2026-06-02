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


async def test_list_products_empty_when_no_rows(
    client: AsyncClient,
    tenant_context: dict,
) -> None:
    r = await client.get("/products/", headers=tenant_context["headers"])
    assert r.status_code == 200
    assert r.json() == []


async def test_create_product_returns_201_with_organization(
    client: AsyncClient,
    category_factory: CategoryFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    r = await client.post(
        "/products/",
        json={"name": "Ejemplo", "category_id": category["id"], "price": 2500},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Ejemplo"
    assert body["price"] == 2500
    assert body["id"]
    assert body["organization_id"] == tenant_context["organization_id"]


async def test_get_product_returns_200(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    created = await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
        name="One",
    )
    r = await client.get(f"/products/{created['id']}", headers=tenant_context["headers"])
    assert r.status_code == 200
    assert r.json()["name"] == "One"


async def test_get_product_unknown_returns_404(
    client: AsyncClient,
    tenant_context: dict,
) -> None:
    r = await client.get(f"/products/{uuid4()}", headers=tenant_context["headers"])
    assert r.status_code == 404


async def test_patch_product_changes_price(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    p = await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
        price=1000,
    )
    r = await client.patch(
        f"/products/{p['id']}",
        json={"price": 4999},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    assert r.json()["price"] == 4999


async def test_patch_product_changes_name(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    p = await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
        name="Old",
    )
    r = await client.patch(
        f"/products/{p['id']}",
        json={"name": "New"},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    assert r.json()["name"] == "New"


async def test_delete_product_returns_204(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    p = await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
        name="To delete",
    )
    r = await client.delete(f"/products/{p['id']}", headers=tenant_context["headers"])
    assert r.status_code == 204


async def test_get_deleted_product_returns_404(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    p = await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
    )
    rid = p["id"]
    await client.delete(f"/products/{rid}", headers=tenant_context["headers"])
    r = await client.get(f"/products/{rid}", headers=tenant_context["headers"])
    assert r.status_code == 404


async def test_product_from_other_organization_not_visible(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
) -> None:
    owner = await user_factory.build(username="owner_prod_iso")
    outsider = await user_factory.build(username="outsider_prod_iso")
    org_a = await organization_factory.build(user_id=owner["id"], name="Org A")
    org_b = await organization_factory.build(user_id=outsider["id"], name="Org B")
    category = await category_factory.build(organization_id=org_b["id"])
    product = await product_factory.build(
        organization_id=org_b["id"],
        category_id=category["id"],
        name="Secret",
    )

    headers_a = tenant_headers(user_id=owner["id"], organization_id=org_a["id"])
    r_list = await client.get("/products/", headers=headers_a)
    assert r_list.status_code == 200
    assert r_list.json() == []

    r_get = await client.get(f"/products/{product['id']}", headers=headers_a)
    assert r_get.status_code == 404


async def test_list_products_filter_by_category_id(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category_a = await category_factory.build(organization_id=tenant_context["organization_id"])
    category_b = await category_factory.build(organization_id=tenant_context["organization_id"])
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category_a["id"],
        name="In A",
    )
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category_b["id"],
        name="In B",
    )

    r = await client.get(
        "/products/",
        params={"category_id": category_a["id"]},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["In A"]


async def test_list_products_filter_by_name_partial(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category = await category_factory.build(organization_id=tenant_context["organization_id"])
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
        name="Laptop Pro",
    )
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category["id"],
        name="Desktop",
    )

    r = await client.get(
        "/products/",
        params={"name": "lap"},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["Laptop Pro"]


async def test_list_products_filter_combined(
    client: AsyncClient,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    tenant_context: dict,
) -> None:
    category_a = await category_factory.build(organization_id=tenant_context["organization_id"])
    category_b = await category_factory.build(organization_id=tenant_context["organization_id"])
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category_a["id"],
        name="Laptop A",
    )
    await product_factory.build(
        organization_id=tenant_context["organization_id"],
        category_id=category_b["id"],
        name="Laptop B",
    )

    r = await client.get(
        "/products/",
        params={"category_id": category_a["id"], "name": "lap"},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["Laptop A"]


async def test_list_products_unknown_filter_param_returns_422(
    client: AsyncClient,
    tenant_context: dict,
) -> None:
    r = await client.get(
        "/products/",
        params={"foo": "bar"},
        headers=tenant_context["headers"],
    )
    assert r.status_code == 422


async def test_list_products_filter_respects_org_isolation(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
) -> None:
    owner = await user_factory.build(username="owner_prod_filter")
    outsider = await user_factory.build(username="outsider_prod_filter")
    org_a = await organization_factory.build(user_id=owner["id"], name="Org Filter A")
    org_b = await organization_factory.build(user_id=outsider["id"], name="Org Filter B")
    category_b = await category_factory.build(organization_id=org_b["id"])
    await product_factory.build(
        organization_id=org_b["id"],
        category_id=category_b["id"],
        name="Secret Laptop",
    )

    headers_a = tenant_headers(user_id=owner["id"], organization_id=org_a["id"])
    r = await client.get(
        "/products/",
        params={"name": "lap", "category_id": category_b["id"]},
        headers=headers_a,
    )
    assert r.status_code == 200
    assert r.json() == []


async def test_api_key_only_sees_own_organization_products(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    category_factory: CategoryFactory,
    product_factory: ProductFactory,
    api_key_factory,
) -> None:
    u = await user_factory.build()
    org_a = await organization_factory.build(user_id=u["id"], name="Key Org A")
    org_b = await organization_factory.build(user_id=u["id"], name="Key Org B")
    category_a = await category_factory.build(organization_id=org_a["id"])
    category_b = await category_factory.build(organization_id=org_b["id"])
    await product_factory.build(
        organization_id=org_a["id"],
        category_id=category_a["id"],
        name="Visible",
    )
    await product_factory.build(
        organization_id=org_b["id"],
        category_id=category_b["id"],
        name="Hidden",
    )
    raw, _meta = await api_key_factory.build(organization_id=org_a["id"])

    r = await client.get("/products/", headers=api_key_headers(raw_key=raw))
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["Visible"]
