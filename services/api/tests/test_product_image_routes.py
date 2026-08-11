from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.lib.storage.deps import set_object_storage
from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory
from tests.fakes.fake_storage import FakeObjectStorage

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


@pytest.fixture
def fake_storage() -> FakeObjectStorage:
    storage = FakeObjectStorage()
    set_object_storage(storage)
    yield storage
    set_object_storage(None)


async def test_presign_returns_key_under_provider_prefix(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    product = await product_factory.build(
        organization_id=provider_context["organization_id"],
        name="Con imagen",
    )
    org_id = provider_context["organization_id"]
    product_id = product["id"]

    response = await client.post(
        f"/products/provider/{product_id}/image/presign",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"content_type": "image/jpeg"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["image_key"].startswith(f"providers/{org_id}/products/{product_id}/")
    assert body["image_key"].endswith(".jpg")
    assert body["headers"]["Content-Type"] == "image/jpeg"
    assert body["upload_url"].startswith("https://upload.test/")
    assert body["expires_in"] > 0
    assert len(fake_storage.presigned_puts) == 1


async def test_presign_separate_folders_per_provider(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    user_a = await user_factory.build()
    org_a = await organization_factory.build(user_id=user_a["id"])
    product_a = await product_factory.build(organization_id=org_a["id"])

    user_b = await user_factory.build()
    org_b = await organization_factory.build(user_id=user_b["id"])
    product_b = await product_factory.build(organization_id=org_b["id"])

    r_a = await client.post(
        f"/products/provider/{product_a['id']}/image/presign",
        params={"organization_id": org_a["id"]},
        headers=bearer_headers(user_id=user_a["id"]),
        json={"content_type": "image/png"},
    )
    r_b = await client.post(
        f"/products/provider/{product_b['id']}/image/presign",
        params={"organization_id": org_b["id"]},
        headers=bearer_headers(user_id=user_b["id"]),
        json={"content_type": "image/webp"},
    )
    assert r_a.status_code == 200
    assert r_b.status_code == 200
    key_a = r_a.json()["image_key"]
    key_b = r_b.json()["image_key"]
    assert key_a.startswith(f"providers/{org_a['id']}/")
    assert key_b.startswith(f"providers/{org_b['id']}/")
    assert key_a.endswith(".png")
    assert key_b.endswith(".webp")


async def test_confirm_sets_image_url(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    product = await product_factory.build(
        organization_id=provider_context["organization_id"],
    )
    product_id = product["id"]
    org_id = provider_context["organization_id"]
    image_key = f"providers/{org_id}/products/{product_id}/{uuid4()}.jpg"

    r_confirm = await client.put(
        f"/products/provider/{product_id}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"image_key": image_key},
    )
    assert r_confirm.status_code == 200
    assert r_confirm.json()["image_url"] == (
        f"http://test-cdn.local/bucket/{image_key}"
    )

    r_get = await client.get(
        f"/products/provider/{product_id}",
        params=provider_context["params"],
        headers=provider_context["headers"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["image_url"] == f"http://test-cdn.local/bucket/{image_key}"


async def test_confirm_rejects_key_for_other_product(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    product = await product_factory.build(
        organization_id=provider_context["organization_id"],
    )
    other_product_id = uuid4()
    org_id = provider_context["organization_id"]
    bad_key = f"providers/{org_id}/products/{other_product_id}/{uuid4()}.jpg"

    response = await client.put(
        f"/products/provider/{product['id']}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"image_key": bad_key},
    )
    assert response.status_code == 422


async def test_replace_image_deletes_previous_object(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    product = await product_factory.build(
        organization_id=provider_context["organization_id"],
    )
    product_id = product["id"]
    org_id = provider_context["organization_id"]
    first_key = f"providers/{org_id}/products/{product_id}/{uuid4()}.jpg"
    second_key = f"providers/{org_id}/products/{product_id}/{uuid4()}.png"

    await client.put(
        f"/products/provider/{product_id}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"image_key": first_key},
    )
    r_second = await client.put(
        f"/products/provider/{product_id}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"image_key": second_key},
    )
    assert r_second.status_code == 200
    assert fake_storage.deleted_keys == [first_key]
    assert r_second.json()["image_url"].endswith(second_key)


async def test_delete_image_clears_url(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    product = await product_factory.build(
        organization_id=provider_context["organization_id"],
    )
    product_id = product["id"]
    org_id = provider_context["organization_id"]
    image_key = f"providers/{org_id}/products/{product_id}/{uuid4()}.jpg"

    await client.put(
        f"/products/provider/{product_id}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"image_key": image_key},
    )
    r_delete = await client.delete(
        f"/products/provider/{product_id}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
    )
    assert r_delete.status_code == 204
    assert fake_storage.deleted_keys == [image_key]

    r_get = await client.get(
        f"/products/provider/{product_id}",
        params=provider_context["params"],
        headers=provider_context["headers"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["image_url"] is None


async def test_delete_product_deletes_s3_object(
    client: AsyncClient,
    provider_context: dict,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    product = await product_factory.build(
        organization_id=provider_context["organization_id"],
    )
    product_id = product["id"]
    org_id = provider_context["organization_id"]
    image_key = f"providers/{org_id}/products/{product_id}/{uuid4()}.webp"

    await client.put(
        f"/products/provider/{product_id}/image",
        params=provider_context["params"],
        headers=provider_context["headers"],
        json={"image_key": image_key},
    )
    r_delete = await client.delete(
        f"/products/provider/{product_id}",
        params=provider_context["params"],
        headers=provider_context["headers"],
    )
    assert r_delete.status_code == 204
    assert image_key in fake_storage.deleted_keys


async def test_presign_non_member_forbidden(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    owner = await user_factory.build()
    org = await organization_factory.build(user_id=owner["id"])
    product = await product_factory.build(organization_id=org["id"])
    outsider = await user_factory.build()

    response = await client.post(
        f"/products/provider/{product['id']}/image/presign",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=outsider["id"]),
        json={"content_type": "image/jpeg"},
    )
    assert response.status_code == 403


async def test_presign_other_org_product_not_found(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    user_a = await user_factory.build()
    org_a = await organization_factory.build(user_id=user_a["id"])
    product_a = await product_factory.build(organization_id=org_a["id"])

    user_b = await user_factory.build()
    org_b = await organization_factory.build(user_id=user_b["id"])

    response = await client.post(
        f"/products/provider/{product_a['id']}/image/presign",
        params={"organization_id": org_b["id"]},
        headers=bearer_headers(user_id=user_b["id"]),
        json={"content_type": "image/jpeg"},
    )
    assert response.status_code == 404
