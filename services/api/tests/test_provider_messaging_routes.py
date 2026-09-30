from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.location_factory import LocationFactory
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def messaging_ctx(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    location_factory: LocationFactory,
) -> dict:
    user = await user_factory.build()
    other_user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"], name="Provider Messaging")
    other_org = await organization_factory.build(
        user_id=other_user["id"],
        name="Other Provider",
    )
    province = await location_factory.build_province(name="Habana Messaging")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Plaza Messaging",
    )
    neighborhood = await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Vedado Messaging",
    )
    other_neighborhood = await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Miramar Messaging",
    )
    return {
        "headers": bearer_headers(user_id=user["id"]),
        "params": {"organization_id": org["id"]},
        "other_headers": bearer_headers(user_id=other_user["id"]),
        "other_params": {"organization_id": other_org["id"]},
        "org_id": org["id"],
        "neighborhood_id": neighborhood["id"],
        "other_neighborhood_id": other_neighborhood["id"],
        "province_id": province["id"],
        "municipality_id": municipality["id"],
    }


async def test_messaging_settings_default_false(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    r = await client.get(
        "/messaging-settings/provider/",
        params=messaging_ctx["params"],
        headers=messaging_ctx["headers"],
    )
    assert r.status_code == 200
    assert r.json() == {"accepts_unconfigured_neighborhoods": False}


async def test_messaging_settings_patch(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    r = await client.patch(
        "/messaging-settings/provider/",
        params=messaging_ctx["params"],
        headers=messaging_ctx["headers"],
        json={"accepts_unconfigured_neighborhoods": True},
    )
    assert r.status_code == 200
    assert r.json()["accepts_unconfigured_neighborhoods"] is True

    r_get = await client.get(
        "/messaging-settings/provider/",
        params=messaging_ctx["params"],
        headers=messaging_ctx["headers"],
    )
    assert r_get.json()["accepts_unconfigured_neighborhoods"] is True


async def test_messaging_price_crud(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    headers = messaging_ctx["headers"]
    params = messaging_ctx["params"]

    r_create = await client.post(
        "/messaging-prices/provider/",
        params=params,
        headers=headers,
        json={
            "neighborhood_id": messaging_ctx["neighborhood_id"],
            "price": {"amount": 1500, "currency": "cup"},
        },
    )
    assert r_create.status_code == 201
    body = r_create.json()
    assert body["organization_id"] == messaging_ctx["org_id"]
    assert body["neighborhood_id"] == messaging_ctx["neighborhood_id"]
    assert body["price"] == {"amount": 1500, "currency": "cup"}
    assert body["neighborhood_name"] == "Vedado Messaging"
    assert body["municipality_name"] == "Plaza Messaging"
    assert body["province_name"] == "Habana Messaging"
    price_id = body["id"]

    r_list = await client.get(
        "/messaging-prices/provider/",
        params=params,
        headers=headers,
    )
    assert r_list.status_code == 200
    items = r_list.json()
    assert isinstance(items, list)
    assert len(items) == 1
    assert items[0]["id"] == price_id

    r_patch = await client.patch(
        f"/messaging-prices/provider/{price_id}",
        params=params,
        headers=headers,
        json={"price": {"amount": 2000, "currency": "usd"}},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["price"] == {"amount": 2000, "currency": "usd"}

    r_delete = await client.delete(
        f"/messaging-prices/provider/{price_id}",
        params=params,
        headers=headers,
    )
    assert r_delete.status_code == 204

    r_list_after = await client.get(
        "/messaging-prices/provider/",
        params=params,
        headers=headers,
    )
    assert r_list_after.json() == []


async def test_messaging_price_duplicate_neighborhood(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    headers = messaging_ctx["headers"]
    params = messaging_ctx["params"]
    payload = {
        "neighborhood_id": messaging_ctx["other_neighborhood_id"],
        "price": {"amount": 100, "currency": "cup"},
    }
    first = await client.post(
        "/messaging-prices/provider/",
        params=params,
        headers=headers,
        json=payload,
    )
    assert first.status_code == 201

    second = await client.post(
        "/messaging-prices/provider/",
        params=params,
        headers=headers,
        json=payload,
    )
    assert second.status_code == 409
    assert second.json()["code"] == "messaging_price_neighborhood_conflict"


async def test_messaging_price_cross_tenant_404(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    create = await client.post(
        "/messaging-prices/provider/",
        params=messaging_ctx["params"],
        headers=messaging_ctx["headers"],
        json={
            "neighborhood_id": messaging_ctx["neighborhood_id"],
            "price": {"amount": 500, "currency": "cup"},
        },
    )
    assert create.status_code == 201
    price_id = create.json()["id"]

    r = await client.patch(
        f"/messaging-prices/provider/{price_id}",
        params=messaging_ctx["other_params"],
        headers=messaging_ctx["other_headers"],
        json={"price": {"amount": 1, "currency": "cup"}},
    )
    assert r.status_code == 404

    r_delete = await client.delete(
        f"/messaging-prices/provider/{price_id}",
        params=messaging_ctx["other_params"],
        headers=messaging_ctx["other_headers"],
    )
    assert r_delete.status_code == 404


async def test_messaging_price_missing_org_422(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    r = await client.get(
        "/messaging-prices/provider/",
        headers=messaging_ctx["headers"],
    )
    assert r.status_code == 422


async def test_messaging_price_unknown_neighborhood(
    client: AsyncClient,
    messaging_ctx: dict,
) -> None:
    r = await client.post(
        "/messaging-prices/provider/",
        params=messaging_ctx["params"],
        headers=messaging_ctx["headers"],
        json={
            "neighborhood_id": str(uuid4()),
            "price": {"amount": 100, "currency": "cup"},
        },
    )
    assert r.status_code == 404
