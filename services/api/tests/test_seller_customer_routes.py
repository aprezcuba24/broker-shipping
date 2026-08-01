from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.location_factory import LocationFactory
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_customer_ctx(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    location_factory: LocationFactory,
) -> dict:
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )
    province = await location_factory.build_province(name="La Habana")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Plaza",
    )
    other_province = await location_factory.build_province(name="Matanzas")
    other_municipality = await location_factory.build_municipality(
        province_id=other_province["id"],
        name="Cardenas",
    )
    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "other_seller_user_id": other_seller_user["id"],
        "other_seller_org_id": other_seller_org["id"],
        "province_id": province["id"],
        "municipality_id": municipality["id"],
        "other_province_id": other_province["id"],
        "other_municipality_id": other_municipality["id"],
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "other_seller_bearer": bearer_headers(user_id=other_seller_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "other_seller_params": {"organization_id": other_seller_org["id"]},
    }


def _customer_payload(ctx: dict, **overrides) -> dict:
    payload = {
        "name": "Juan Perez",
        "ci": "90010112345",
        "phone": "51234567",
        "address": {
            "address": "Calle 1 #100",
            "province_id": ctx["province_id"],
            "municipality_id": ctx["municipality_id"],
        },
    }
    payload.update(overrides)
    return payload


async def test_customer_crud_happy_path(
    client: AsyncClient,
    seller_customer_ctx: dict,
) -> None:
    created = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(seller_customer_ctx),
    )
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Juan Perez"
    assert body["ci"] == "90010112345"
    assert body["phone"] == "51234567"
    assert body["seller_organization_id"] == seller_customer_ctx["seller_org_id"]
    assert body["address"]["address"] == "Calle 1 #100"
    assert body["address"]["province_id"] == seller_customer_ctx["province_id"]
    assert body["address"]["municipality_id"] == seller_customer_ctx["municipality_id"]
    customer_id = body["id"]

    detail = await client.get(
        f"/customers/seller/{customer_id}",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert detail.status_code == 200
    assert detail.json()["id"] == customer_id

    patched = await client.patch(
        f"/customers/seller/{customer_id}",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json={
            "name": "Juan Actualizado",
            "address": {
                "address": "Calle 2 #200",
                "province_id": seller_customer_ctx["province_id"],
                "municipality_id": seller_customer_ctx["municipality_id"],
            },
        },
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Juan Actualizado"
    assert patched.json()["address"]["address"] == "Calle 2 #200"

    deleted = await client.delete(
        f"/customers/seller/{customer_id}",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert deleted.status_code == 204

    missing = await client.get(
        f"/customers/seller/{customer_id}",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert missing.status_code == 404


async def test_list_customers_with_filters(
    client: AsyncClient,
    seller_customer_ctx: dict,
) -> None:
    await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(
            seller_customer_ctx,
            name="Ana Lopez",
            ci="11111111111",
            phone="51111111",
        ),
    )
    await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(
            seller_customer_ctx,
            name="Pedro Diaz",
            ci="22222222222",
            phone="52222222",
        ),
    )

    by_name = await client.get(
        "/customers/seller/",
        params={**seller_customer_ctx["seller_params"], "name": "Ana"},
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert by_name.status_code == 200
    assert by_name.json()["total"] == 1
    assert by_name.json()["items"][0]["name"] == "Ana Lopez"

    by_ci = await client.get(
        "/customers/seller/",
        params={**seller_customer_ctx["seller_params"], "ci": "22222222222"},
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert by_ci.status_code == 200
    assert by_ci.json()["total"] == 1
    assert by_ci.json()["items"][0]["ci"] == "22222222222"

    by_phone = await client.get(
        "/customers/seller/",
        params={**seller_customer_ctx["seller_params"], "phone": "5111"},
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert by_phone.status_code == 200
    assert by_phone.json()["total"] == 1
    assert by_phone.json()["items"][0]["phone"] == "51111111"


async def test_seller_cannot_access_other_seller_customer(
    client: AsyncClient,
    seller_customer_ctx: dict,
) -> None:
    created = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(seller_customer_ctx),
    )
    assert created.status_code == 201
    customer_id = created.json()["id"]

    r = await client.get(
        f"/customers/seller/{customer_id}",
        params=seller_customer_ctx["other_seller_params"],
        headers=seller_customer_ctx["other_seller_bearer"],
    )
    assert r.status_code == 404


async def test_duplicate_ci_returns_409(
    client: AsyncClient,
    seller_customer_ctx: dict,
) -> None:
    payload = _customer_payload(seller_customer_ctx, ci="99999999999")
    first = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=payload,
    )
    assert first.status_code == 201

    second = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(
            seller_customer_ctx,
            name="Otro",
            ci="99999999999",
            phone="59999999",
        ),
    )
    assert second.status_code == 409


async def test_duplicate_phone_returns_409(
    client: AsyncClient,
    seller_customer_ctx: dict,
) -> None:
    first = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(
            seller_customer_ctx,
            ci="88888888888",
            phone="58888888",
        ),
    )
    assert first.status_code == 201

    second = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(
            seller_customer_ctx,
            name="Otro",
            ci="77777777777",
            phone="58888888",
        ),
    )
    assert second.status_code == 409


async def test_municipality_from_other_province_returns_404(
    client: AsyncClient,
    seller_customer_ctx: dict,
) -> None:
    r = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(
            seller_customer_ctx,
            address={
                "address": "Calle X",
                "province_id": seller_customer_ctx["province_id"],
                "municipality_id": seller_customer_ctx["other_municipality_id"],
            },
        ),
    )
    assert r.status_code == 404


async def test_delete_customer_with_orders_returns_409(
    client: AsyncClient,
    seller_customer_ctx: dict,
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
) -> None:
    created = await client.post(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json=_customer_payload(seller_customer_ctx),
    )
    assert created.status_code == 201
    customer_id = created.json()["id"]

    provider_user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_org["id"],
        seller_organization_id=seller_customer_ctx["seller_org_id"],
    )
    product = await product_factory.build(organization_id=provider_org["id"])

    order = await client.post(
        "/orders/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
        json={
            "customer_id": customer_id,
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 1,
                    "seller_provider_price": 1000,
                },
            ],
        },
    )
    assert order.status_code == 201

    deleted = await client.delete(
        f"/customers/seller/{customer_id}",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert deleted.status_code == 409


async def test_customer_forbidden_and_validation(
    client: AsyncClient,
    seller_customer_ctx: dict,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    outsider = await user_factory.build()
    forbidden = await client.get(
        "/customers/seller/",
        params=seller_customer_ctx["seller_params"],
        headers=bearer_headers(user_id=outsider["id"]),
    )
    assert forbidden.status_code == 403

    provider_user = await user_factory.build()
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    wrong_type = await client.get(
        "/customers/seller/",
        params={"organization_id": provider_org["id"]},
        headers=bearer_headers(user_id=provider_user["id"]),
    )
    assert wrong_type.status_code == 403

    missing_org = await client.get(
        "/customers/seller/",
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert missing_org.status_code == 422

    unknown = await client.get(
        f"/customers/seller/{uuid4()}",
        params=seller_customer_ctx["seller_params"],
        headers=seller_customer_ctx["seller_bearer"],
    )
    assert unknown.status_code == 404
