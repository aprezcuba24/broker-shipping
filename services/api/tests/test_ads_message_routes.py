from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.lib.storage.deps import set_object_storage
from tests.factories.ads_message_factory import AdsMessageFactory
from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory
from tests.fakes.fake_storage import FakeObjectStorage

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_context(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    user = await user_factory.build()
    org = await organization_factory.build_seller(user_id=user["id"])
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


async def test_create_list_get_patch_delete_ads_message(
    client: AsyncClient,
    seller_context: dict,
) -> None:
    r_create = await client.post(
        "/facebook/ads-messages/",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={
            "title": "Oferta semanal",
            "description": "Promoción con emoji 🚀 y más texto",
        },
    )
    assert r_create.status_code == 201
    created = r_create.json()
    assert created["title"] == "Oferta semanal"
    assert created["description"] == "Promoción con emoji 🚀 y más texto"
    assert isinstance(created["code"], str)
    assert len(created["code"]) == 4
    assert created["photo_url"] is None
    assert created["organization_id"] == seller_context["organization_id"]
    message_id = created["id"]
    code = created["code"]

    r_list = await client.get(
        "/facebook/ads-messages/",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_list.status_code == 200
    assert r_list.json()["total"] == 1
    assert r_list.json()["items"][0]["id"] == message_id

    r_get = await client.get(
        f"/facebook/ads-messages/{message_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["code"] == code

    r_patch = await client.patch(
        f"/facebook/ads-messages/{message_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"title": "Oferta actualizada"},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["title"] == "Oferta actualizada"
    assert r_patch.json()["code"] == code

    r_delete = await client.delete(
        f"/facebook/ads-messages/{message_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_delete.status_code == 204


async def test_code_not_accepted_in_create_body(
    client: AsyncClient,
    seller_context: dict,
) -> None:
    r = await client.post(
        "/facebook/ads-messages/",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={
            "title": "Sin código",
            "description": "Texto",
            "code": "XXXX",
        },
    )
    assert r.status_code == 201
    assert r.json()["code"] != "XXXX"


async def test_provider_org_forbidden(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=user["id"])
    r = await client.get(
        "/facebook/ads-messages/",
        headers=bearer_headers(user_id=user["id"]),
        params={"organization_id": provider_org["id"]},
    )
    assert r.status_code == 403


async def test_presign_confirm_and_reject_wrong_prefix(
    client: AsyncClient,
    seller_context: dict,
    ads_message_factory: AdsMessageFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    message = await ads_message_factory.build(
        organization_id=seller_context["organization_id"],
    )
    message_id = message["id"]
    org_id = seller_context["organization_id"]

    r_presign = await client.post(
        f"/facebook/ads-messages/{message_id}/photo/presign",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"content_type": "image/jpeg"},
    )
    assert r_presign.status_code == 200
    body = r_presign.json()
    assert body["image_key"].startswith(f"sellers/{org_id}/ads-messages/{message_id}/")
    assert body["image_key"].endswith(".jpg")
    assert len(fake_storage.presigned_puts) == 1

    image_key = body["image_key"]
    r_confirm = await client.put(
        f"/facebook/ads-messages/{message_id}/photo",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"image_key": image_key},
    )
    assert r_confirm.status_code == 200
    assert r_confirm.json()["photo_url"] == (
        f"http://test-cdn.local/bucket/{image_key}"
    )

    bad_key = f"providers/{org_id}/products/{uuid4()}/{uuid4()}.jpg"
    r_bad = await client.put(
        f"/facebook/ads-messages/{message_id}/photo",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"image_key": bad_key},
    )
    assert r_bad.status_code == 422


async def test_delete_photo(
    client: AsyncClient,
    seller_context: dict,
    ads_message_factory: AdsMessageFactory,
    fake_storage: FakeObjectStorage,
) -> None:
    message = await ads_message_factory.build(
        organization_id=seller_context["organization_id"],
    )
    message_id = message["id"]
    org_id = seller_context["organization_id"]
    image_key = f"sellers/{org_id}/ads-messages/{message_id}/{uuid4()}.jpg"

    r_confirm = await client.put(
        f"/facebook/ads-messages/{message_id}/photo",
        headers=seller_context["headers"],
        params=seller_context["params"],
        json={"image_key": image_key},
    )
    assert r_confirm.status_code == 200

    r_delete = await client.delete(
        f"/facebook/ads-messages/{message_id}/photo",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_delete.status_code == 204
    assert fake_storage.deleted_keys == [image_key]

    r_get = await client.get(
        f"/facebook/ads-messages/{message_id}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r_get.status_code == 200
    assert r_get.json()["photo_url"] is None


async def test_other_org_ads_message_not_found(
    client: AsyncClient,
    seller_context: dict,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    ads_message_factory: AdsMessageFactory,
) -> None:
    other_user = await user_factory.build()
    other_org = await organization_factory.build_seller(user_id=other_user["id"])
    message = await ads_message_factory.build(organization_id=other_org["id"])

    r = await client.get(
        f"/facebook/ads-messages/{message['id']}",
        headers=seller_context["headers"],
        params=seller_context["params"],
    )
    assert r.status_code == 404
