from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.tag_factory import TagFactory
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
    assert body["tags"] == []
    product_id = body["id"]

    r_list = await client.get(
        "/products/provider/",
        params={**params, "name": "arroz"},
        headers=headers,
    )
    assert r_list.status_code == 200
    body_list = r_list.json()
    assert body_list["total"] == 1
    assert body_list["page"] == 1
    assert body_list["page_size"] == 20
    assert body_list["pages"] == 1
    assert [p["id"] for p in body_list["items"]] == [product_id]

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


async def test_list_products_pagination(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
) -> None:
    headers = provider_context["headers"]
    params = provider_context["params"]
    org_id = provider_context["organization_id"]
    for name in ("Alpha", "Bravo", "Charlie", "Delta", "Echo"):
        await product_factory.build(organization_id=org_id, name=name)

    r1 = await client.get(
        "/products/provider/",
        params={**params, "page": 1, "page_size": 2},
        headers=headers,
    )
    assert r1.status_code == 200
    page1 = r1.json()
    assert page1["total"] == 5
    assert page1["page"] == 1
    assert page1["page_size"] == 2
    assert page1["pages"] == 3
    assert [p["name"] for p in page1["items"]] == ["Alpha", "Bravo"]

    r2 = await client.get(
        "/products/provider/",
        params={**params, "page": 2, "page_size": 2},
        headers=headers,
    )
    assert r2.status_code == 200
    page2 = r2.json()
    assert page2["total"] == 5
    assert [p["name"] for p in page2["items"]] == ["Charlie", "Delta"]

    r3 = await client.get(
        "/products/provider/",
        params={**params, "page": 3, "page_size": 2},
        headers=headers,
    )
    assert r3.status_code == 200
    assert [p["name"] for p in r3.json()["items"]] == ["Echo"]


async def test_list_products_page_out_of_range(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
) -> None:
    await product_factory.build(
        organization_id=provider_context["organization_id"],
        name="Only",
    )
    r = await client.get(
        "/products/provider/",
        params={**provider_context["params"], "page": 99, "page_size": 10},
        headers=provider_context["headers"],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 1
    assert body["pages"] == 1


async def test_list_products_invalid_pagination_returns_422(
    client: AsyncClient,
    provider_context: dict,
) -> None:
    headers = provider_context["headers"]
    params = provider_context["params"]

    r_zero = await client.get(
        "/products/provider/",
        params={**params, "page": 0},
        headers=headers,
    )
    assert r_zero.status_code == 422

    r_size = await client.get(
        "/products/provider/",
        params={**params, "page_size": 0},
        headers=headers,
    )
    assert r_size.status_code == 422

    r_max = await client.get(
        "/products/provider/",
        params={**params, "page_size": 101},
        headers=headers,
    )
    assert r_max.status_code == 422


async def test_list_products_name_filter_with_pagination(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
) -> None:
    org_id = provider_context["organization_id"]
    await product_factory.build(organization_id=org_id, name="Arroz blanco")
    await product_factory.build(organization_id=org_id, name="Arroz integral")
    await product_factory.build(organization_id=org_id, name="Aceite")

    r = await client.get(
        "/products/provider/",
        params={
            **provider_context["params"],
            "name": "arroz",
            "page": 1,
            "page_size": 1,
        },
        headers=provider_context["headers"],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 2
    assert body["pages"] == 2
    assert len(body["items"]) == 1
    assert "Arroz" in body["items"][0]["name"]


async def test_create_product_with_tag_ids(
    client: AsyncClient,
    provider_context: dict,
    tag_factory: TagFactory,
) -> None:
    org_id = provider_context["organization_id"]
    tag_a = await tag_factory.build(organization_id=org_id, name="A")
    tag_b = await tag_factory.build(organization_id=org_id, name="B")

    r = await client.post(
        "/products/provider/",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={
            "name": "Con tags",
            "tag_ids": [tag_b["id"], tag_a["id"]],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert [t["name"] for t in body["tags"]] == ["A", "B"]
    assert {t["id"] for t in body["tags"]} == {tag_a["id"], tag_b["id"]}


async def test_create_product_uses_only_tag_ids_from_organization(
    client: AsyncClient,
    provider_context: dict,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    tag_factory: TagFactory,
) -> None:
    other_user = await user_factory.build()
    other_org = await organization_factory.build(user_id=other_user["id"])
    foreign_tag = await tag_factory.build(organization_id=other_org["id"])
    local_tag = await tag_factory.build(
        organization_id=provider_context["organization_id"],
        name="Local",
    )

    r = await client.post(
        "/products/provider/",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={
            "name": "Filtered tags",
            "tag_ids": [foreign_tag["id"], local_tag["id"]],
        },
    )
    assert r.status_code == 201
    assert [tag["id"] for tag in r.json()["tags"]] == [local_tag["id"]]


async def test_patch_product_replaces_tag_ids(
    client: AsyncClient,
    provider_context: dict,
    tag_factory: TagFactory,
) -> None:
    org_id = provider_context["organization_id"]
    tag_a = await tag_factory.build(organization_id=org_id, name="Keep")
    tag_b = await tag_factory.build(organization_id=org_id, name="Drop")
    tag_c = await tag_factory.build(organization_id=org_id, name="New")

    r_create = await client.post(
        "/products/provider/",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"name": "Tagged", "tag_ids": [tag_a["id"], tag_b["id"]]},
    )
    assert r_create.status_code == 201
    product_id = r_create.json()["id"]

    r_patch = await client.patch(
        f"/products/provider/{product_id}",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"tag_ids": [tag_c["id"]]},
    )
    assert r_patch.status_code == 200
    assert [t["id"] for t in r_patch.json()["tags"]] == [tag_c["id"]]

    r_clear = await client.patch(
        f"/products/provider/{product_id}",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"tag_ids": []},
    )
    assert r_clear.status_code == 200
    assert r_clear.json()["tags"] == []


async def test_product_public_excludes_inactive_tags(
    client: AsyncClient,
    provider_context: dict,
    tag_factory: TagFactory,
) -> None:
    org_id = provider_context["organization_id"]
    active = await tag_factory.build(
        organization_id=org_id,
        name="Active",
        is_active=True,
    )
    inactive = await tag_factory.build(
        organization_id=org_id,
        name="Inactive",
        is_active=False,
    )

    r = await client.post(
        "/products/provider/",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={
            "name": "Mixed tags",
            "tag_ids": [active["id"], inactive["id"]],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert [t["name"] for t in body["tags"]] == ["Active"]
    assert all(t["is_active"] for t in body["tags"])


async def test_list_products_filters_by_all_tag_ids(
    client: AsyncClient,
    provider_context: dict,
    tag_factory: TagFactory,
) -> None:
    org_id = provider_context["organization_id"]
    headers = provider_context["headers"]
    params = provider_context["params"]
    tag_1 = await tag_factory.build(organization_id=org_id, name="T1")
    tag_2 = await tag_factory.build(organization_id=org_id, name="T2")
    tag_3 = await tag_factory.build(organization_id=org_id, name="T3")

    r_a = await client.post(
        "/products/provider/",
        params=params,
        headers=headers,
        json={"name": "Product A", "tag_ids": [tag_1["id"], tag_2["id"]]},
    )
    r_b = await client.post(
        "/products/provider/",
        params=params,
        headers=headers,
        json={"name": "Product B", "tag_ids": [tag_1["id"]]},
    )
    r_c = await client.post(
        "/products/provider/",
        params=params,
        headers=headers,
        json={"name": "Product C", "tag_ids": []},
    )
    assert r_a.status_code == 201
    assert r_b.status_code == 201
    assert r_c.status_code == 201
    product_a = r_a.json()["id"]
    product_b = r_b.json()["id"]

    r_one = await client.get(
        "/products/provider/",
        params=[*params.items(), ("tag_ids", tag_1["id"])],
        headers=headers,
    )
    assert r_one.status_code == 200
    assert {p["id"] for p in r_one.json()["items"]} == {product_a, product_b}

    r_both = await client.get(
        "/products/provider/",
        params=[
            *params.items(),
            ("tag_ids", tag_1["id"]),
            ("tag_ids", tag_2["id"]),
        ],
        headers=headers,
    )
    assert r_both.status_code == 200
    assert [p["id"] for p in r_both.json()["items"]] == [product_a]

    r_none = await client.get(
        "/products/provider/",
        params=[
            *params.items(),
            ("tag_ids", tag_1["id"]),
            ("tag_ids", tag_3["id"]),
        ],
        headers=headers,
    )
    assert r_none.status_code == 200
    assert r_none.json()["items"] == []
    assert r_none.json()["total"] == 0
