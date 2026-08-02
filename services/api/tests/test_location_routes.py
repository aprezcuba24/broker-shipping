import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.location_factory import LocationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_list_provinces_and_municipalities(
    client: AsyncClient,
    user_factory: UserFactory,
    location_factory: LocationFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    province = await location_factory.build_province(name="La Habana")
    other = await location_factory.build_province(name="Matanzas")
    mun_a = await location_factory.build_municipality(
        province_id=province["id"],
        name="Plaza",
    )
    await location_factory.build_municipality(
        province_id=other["id"],
        name="Cardenas",
    )

    provinces = await client.get("/locations/provinces", headers=headers)
    assert provinces.status_code == 200
    names = [p["name"] for p in provinces.json()]
    assert "La Habana" in names
    assert "Matanzas" in names

    municipalities = await client.get(
        f"/locations/provinces/{province['id']}/municipalities",
        headers=headers,
    )
    assert municipalities.status_code == 200
    body = municipalities.json()
    assert len(body) == 1
    assert body[0]["id"] == mun_a["id"]
    assert body[0]["name"] == "Plaza"
    assert body[0]["province_id"] == province["id"]


async def test_list_municipalities_unknown_province_returns_404(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])
    from uuid import uuid4

    response = await client.get(
        f"/locations/provinces/{uuid4()}/municipalities",
        headers=headers,
    )
    assert response.status_code == 404


async def test_locations_require_auth(client: AsyncClient) -> None:
    response = await client.get("/locations/provinces")
    assert response.status_code == 401
