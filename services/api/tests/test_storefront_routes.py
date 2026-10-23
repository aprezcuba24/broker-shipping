from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.models.order.enums import Currency
from app.models.product.product_tag import ProductTag
from tests.factories.location_factory import LocationFactory
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.product_factory import ProductFactory
from tests.factories.tag_factory import TagFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def storefront_ctx(
    db_session,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    product_factory: ProductFactory,
    tag_factory: TagFactory,
    location_factory: LocationFactory,
) -> dict:
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()
    provider_user = await user_factory.build()
    other_provider_user = await user_factory.build()

    seller_org = await organization_factory.build_seller(
        user_id=seller_user["id"],
        name="Librería Centro",
    )
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
        name="Otra Librería",
    )
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    other_provider_org = await organization_factory.build(
        user_id=other_provider_user["id"],
    )

    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider_org["id"],
        seller_organization_id=seller_org["id"],
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=other_provider_org["id"],
        seller_organization_id=other_seller_org["id"],
    )

    author = await tag_factory.build(
        organization_id=provider_org["id"],
        name="García Márquez",
    )
    book = await product_factory.build(
        organization_id=provider_org["id"],
        name="Cien años de soledad",
        description="Edición de bolsillo",
        price=15000,
        stock=1,
        currency=Currency.cup,
        has_commission=False,
    )
    db_session.add(
        ProductTag(product_id=book["id"], tag_id=author["id"]),
    )
    await db_session.commit()

    other_book = await product_factory.build(
        organization_id=other_provider_org["id"],
        name="Libro ajeno",
        price=5000,
        stock=2,
        has_commission=False,
    )

    province = await location_factory.build_province(name="La Habana Store")
    municipality = await location_factory.build_municipality(
        province_id=province["id"],
        name="Plaza Store",
    )
    neighborhood = await location_factory.build_neighborhood(
        municipality_id=municipality["id"],
        name="Vedado Store",
    )

    return {
        "seller_org_id": seller_org["id"],
        "other_seller_org_id": other_seller_org["id"],
        "provider_org_id": provider_org["id"],
        "book_id": book["id"],
        "other_book_id": other_book["id"],
        "author_id": author["id"],
        "province_id": province["id"],
        "municipality_id": municipality["id"],
        "neighborhood_id": neighborhood["id"],
        "params": {"organization_id": seller_org["id"]},
        "other_params": {"organization_id": other_seller_org["id"]},
    }


async def test_storefront_info(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get("/storefront/", params=storefront_ctx["params"])
    assert r.status_code == 200
    body = r.json()
    assert body["organization_id"] == storefront_ctx["seller_org_id"]
    assert body["name"] == "Librería Centro"


async def test_storefront_info_provider_org_is_404(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get(
        "/storefront/",
        params={"organization_id": storefront_ctx["provider_org_id"]},
    )
    assert r.status_code == 404


async def test_storefront_lists_only_linked_products(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get("/storefront/products", params=storefront_ctx["params"])
    assert r.status_code == 200
    body = r.json()
    ids = {item["id"] for item in body["items"]}
    assert storefront_ctx["book_id"] in ids
    assert storefront_ctx["other_book_id"] not in ids
    book = next(item for item in body["items"] if item["id"] == storefront_ctx["book_id"])
    assert book["name"] == "Cien años de soledad"
    assert book["description"] == "Edición de bolsillo"
    assert book["price"] == {"amount": 15000, "currency": "cup"}
    assert book["stock"] == 1
    assert book["tags"][0]["name"] == "García Márquez"
    assert "commission" not in book
    assert "notes" not in book


async def test_storefront_product_detail(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get(
        f"/storefront/products/{storefront_ctx['book_id']}",
        params=storefront_ctx["params"],
    )
    assert r.status_code == 200
    assert r.json()["id"] == storefront_ctx["book_id"]


async def test_storefront_foreign_product_is_404(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get(
        f"/storefront/products/{storefront_ctx['other_book_id']}",
        params=storefront_ctx["params"],
    )
    assert r.status_code == 404


async def test_storefront_filter_by_tag(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get(
        "/storefront/products",
        params={
            **storefront_ctx["params"],
            "tag_id": storefront_ctx["author_id"],
        },
    )
    assert r.status_code == 200
    ids = {item["id"] for item in r.json()["items"]}
    assert ids == {storefront_ctx["book_id"]}


async def test_storefront_tags(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.get("/storefront/tags", params=storefront_ctx["params"])
    assert r.status_code == 200
    names = {item["name"] for item in r.json()["items"]}
    assert "García Márquez" in names


async def test_storefront_locations_without_auth(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    provinces = await client.get("/storefront/locations/provinces")
    assert provinces.status_code == 200
    assert any(p["id"] == storefront_ctx["province_id"] for p in provinces.json())

    municipalities = await client.get(
        f"/storefront/locations/provinces/{storefront_ctx['province_id']}/municipalities",
    )
    assert municipalities.status_code == 200
    assert any(
        m["id"] == storefront_ctx["municipality_id"] for m in municipalities.json()
    )

    neighborhoods = await client.get(
        f"/storefront/locations/municipalities/{storefront_ctx['municipality_id']}/neighborhoods",
    )
    assert neighborhoods.status_code == 200
    assert any(
        n["id"] == storefront_ctx["neighborhood_id"] for n in neighborhoods.json()
    )


async def test_storefront_checkout_creates_order_and_reserves_stock(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.post(
        "/storefront/checkout",
        params=storefront_ctx["params"],
        json={
            "name": "Ana Compradora",
            "ci": "85010112345",
            "phone": "51234567",
            "address": {
                "address": "Calle Libro 12",
                "province_id": storefront_ctx["province_id"],
                "municipality_id": storefront_ctx["municipality_id"],
                "neighborhood_id": storefront_ctx["neighborhood_id"],
            },
            "items": [
                {
                    "product_id": storefront_ctx["book_id"],
                    "quantity": 1,
                },
            ],
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["code"]
    assert body["order_id"]
    assert len(body["items"]) == 1
    assert body["items"][0]["product_name"] == "Cien años de soledad"
    assert body["items"][0]["quantity"] == 1
    assert body["items"][0]["unit_price"] == {"amount": 15000, "currency": "cup"}
    assert body["totals"] == [{"amount": 15000, "currency": "cup"}]

    detail = await client.get(
        f"/storefront/products/{storefront_ctx['book_id']}",
        params=storefront_ctx["params"],
    )
    assert detail.status_code == 200
    assert detail.json()["stock"] == 0


async def test_storefront_checkout_unknown_product_is_404(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.post(
        "/storefront/checkout",
        params=storefront_ctx["params"],
        json={
            "name": "Ana Compradora",
            "ci": "85010112346",
            "phone": "51234568",
            "address": {
                "address": "Calle Libro 12",
                "province_id": storefront_ctx["province_id"],
                "municipality_id": storefront_ctx["municipality_id"],
                "neighborhood_id": storefront_ctx["neighborhood_id"],
            },
            "items": [
                {
                    "product_id": storefront_ctx["other_book_id"],
                    "quantity": 1,
                },
            ],
        },
    )
    assert r.status_code == 404


async def test_storefront_checkout_missing_product_is_404(
    client: AsyncClient,
    storefront_ctx: dict,
) -> None:
    r = await client.post(
        "/storefront/checkout",
        params=storefront_ctx["params"],
        json={
            "name": "Ana Compradora",
            "ci": "85010112347",
            "phone": "51234569",
            "address": {
                "address": "Calle Libro 12",
                "province_id": storefront_ctx["province_id"],
                "municipality_id": storefront_ctx["municipality_id"],
                "neighborhood_id": storefront_ctx["neighborhood_id"],
            },
            "items": [
                {
                    "product_id": str(uuid4()),
                    "quantity": 1,
                },
            ],
        },
    )
    assert r.status_code == 404
