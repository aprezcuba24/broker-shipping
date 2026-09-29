from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.location_factory import LocationFactory
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_admin_locations_require_super_admin(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    response = await client.get("/locations/admin/provinces", headers=headers)
    assert response.status_code == 403

    create = await client.post(
        "/locations/admin/provinces",
        headers=headers,
        json={"name": "Blocked"},
    )
    assert create.status_code == 403


async def test_admin_province_crud(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    headers = bearer_headers(user_id=admin["id"])

    created = await client.post(
        "/locations/admin/provinces",
        headers=headers,
        json={"name": "Villa Clara"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Villa Clara"
    assert "created_at" in body
    province_id = body["id"]

    listed = await client.get(
        "/locations/admin/provinces",
        headers=headers,
        params={"name": "villa"},
    )
    assert listed.status_code == 200
    listed_body = listed.json()
    assert listed_body["total"] >= 1
    assert any(item["id"] == province_id for item in listed_body["items"])

    patched = await client.patch(
        f"/locations/admin/provinces/{province_id}",
        headers=headers,
        json={"name": "Villa Clara Centro"},
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Villa Clara Centro"

    deleted = await client.delete(
        f"/locations/admin/provinces/{province_id}",
        headers=headers,
    )
    assert deleted.status_code == 204

    missing = await client.get(
        f"/locations/admin/provinces/{province_id}",
        headers=headers,
    )
    assert missing.status_code == 404


async def test_admin_province_duplicate_name(
    client: AsyncClient,
    user_factory: UserFactory,
    location_factory: LocationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    headers = bearer_headers(user_id=admin["id"])
    await location_factory.build_province(name="Camaguey")

    response = await client.post(
        "/locations/admin/provinces",
        headers=headers,
        json={"name": "camaguey"},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "province_name_conflict"


async def test_admin_municipality_and_neighborhood_crud(
    client: AsyncClient,
    user_factory: UserFactory,
    location_factory: LocationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    headers = bearer_headers(user_id=admin["id"])
    province = await location_factory.build_province(name="Holguin")

    mun = await client.post(
        "/locations/admin/municipalities",
        headers=headers,
        json={"name": "Gibara", "province_id": province["id"]},
    )
    assert mun.status_code == 201
    mun_body = mun.json()
    assert mun_body["name"] == "Gibara"
    assert mun_body["province_id"] == province["id"]
    assert mun_body["province_name"] == "Holguin"
    municipality_id = mun_body["id"]

    listed_mun = await client.get(
        "/locations/admin/municipalities",
        headers=headers,
        params={"province_id": province["id"], "name": "gib"},
    )
    assert listed_mun.status_code == 200
    assert listed_mun.json()["total"] == 1

    neigh = await client.post(
        "/locations/admin/neighborhoods",
        headers=headers,
        json={"name": "Centro", "municipality_id": municipality_id},
    )
    assert neigh.status_code == 201
    neigh_body = neigh.json()
    assert neigh_body["name"] == "Centro"
    assert neigh_body["municipality_id"] == municipality_id
    assert neigh_body["municipality_name"] == "Gibara"
    assert neigh_body["province_name"] == "Holguin"
    neighborhood_id = neigh_body["id"]

    listed_neigh = await client.get(
        "/locations/admin/neighborhoods",
        headers=headers,
        params={"province_id": province["id"]},
    )
    assert listed_neigh.status_code == 200
    assert any(item["id"] == neighborhood_id for item in listed_neigh.json()["items"])

    patched_neigh = await client.patch(
        f"/locations/admin/neighborhoods/{neighborhood_id}",
        headers=headers,
        json={"name": "Centro Histórico"},
    )
    assert patched_neigh.status_code == 200
    assert patched_neigh.json()["name"] == "Centro Histórico"

    deleted_neigh = await client.delete(
        f"/locations/admin/neighborhoods/{neighborhood_id}",
        headers=headers,
    )
    assert deleted_neigh.status_code == 204

    deleted_mun = await client.delete(
        f"/locations/admin/municipalities/{municipality_id}",
        headers=headers,
    )
    assert deleted_mun.status_code == 204


async def test_admin_delete_blocked_by_children(
    client: AsyncClient,
    user_factory: UserFactory,
    location_factory: LocationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    headers = bearer_headers(user_id=admin["id"])
    province = await location_factory.build_province(name="Pinar")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Consolacion",
    )
    await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Pueblo",
    )

    delete_mun = await client.delete(
        f"/locations/admin/municipalities/{municipality['id']}",
        headers=headers,
    )
    assert delete_mun.status_code == 409
    assert delete_mun.json()["code"] == "municipality_has_neighborhoods"

    delete_prov = await client.delete(
        f"/locations/admin/provinces/{province['id']}",
        headers=headers,
    )
    assert delete_prov.status_code == 409
    assert delete_prov.json()["code"] == "province_has_municipalities"


async def test_admin_delete_neighborhood_blocked_by_address(
    client: AsyncClient,
    user_factory: UserFactory,
    location_factory: LocationFactory,
    organization_factory: OrganizationFactory,
    customer_factory: CustomerFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    seller_user = await user_factory.build()
    headers = bearer_headers(user_id=admin["id"])
    seller = await organization_factory.build_seller(user_id=seller_user["id"])
    province = await location_factory.build_province(name="Artemisa")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Guanajay",
    )
    neighborhood = await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Reparto",
    )
    await customer_factory.build(
        seller_organization_id=seller["id"],
        province_id=province["id"],
        municipality_id=municipality["id"],
        neighborhood_id=neighborhood["id"],
    )

    response = await client.delete(
        f"/locations/admin/neighborhoods/{neighborhood['id']}",
        headers=headers,
    )
    assert response.status_code == 409
    assert response.json()["code"] == "neighborhood_in_use"


async def test_admin_municipality_duplicate_name(
    client: AsyncClient,
    user_factory: UserFactory,
    location_factory: LocationFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    headers = bearer_headers(user_id=admin["id"])
    province = await location_factory.build_province(name="Ciego")
    await location_factory.build_municipality(
        province_id=province["id"],
        name="Moron",
    )

    response = await client.post(
        "/locations/admin/municipalities",
        headers=headers,
        json={"name": "Moron", "province_id": province["id"]},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "municipality_name_conflict"


async def test_admin_get_unknown_returns_404(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    headers = bearer_headers(user_id=admin["id"])
    response = await client.get(
        f"/locations/admin/provinces/{uuid4()}",
        headers=headers,
    )
    assert response.status_code == 404
