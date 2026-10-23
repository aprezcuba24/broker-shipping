from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.schemas.location import (
    MunicipalityPublic,
    NeighborhoodPublic,
    ProvincePublic,
)
from app.schemas.pagination import Page
from app.schemas.storefront import (
    StorefrontCheckoutCreate,
    StorefrontCheckoutPublic,
    StorefrontInfoPublic,
    StorefrontProductPublic,
    StorefrontTagPublic,
)
from app.services import location as location_service
from app.services import storefront as storefront_service

router = APIRouter(prefix="/storefront", tags=["storefront"])


@router.get("/", response_model=StorefrontInfoPublic)
async def get_storefront(
    organization_id: UUID,
    session: SessionDep,
) -> StorefrontInfoPublic:
    return await storefront_service.get_storefront_info(session, organization_id)


@router.get("/products", response_model=Page[StorefrontProductPublic])
async def list_products(
    organization_id: UUID,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    tag_id: UUID | None = None,
) -> Page[StorefrontProductPublic]:
    result = await storefront_service.list_storefront_products(
        session,
        organization_id,
        pagination=pagination,
        name=name,
        tag_id=tag_id,
    )
    return Page.from_mapped(
        result,
        pagination,
        storefront_service.storefront_product_to_public,
    )


@router.get("/products/{product_id}", response_model=StorefrontProductPublic)
async def get_product(
    product_id: UUID,
    organization_id: UUID,
    session: SessionDep,
) -> StorefrontProductPublic:
    product = await storefront_service.get_storefront_product(
        session,
        product_id,
        organization_id,
    )
    return storefront_service.storefront_product_to_public(product)


@router.get("/tags", response_model=Page[StorefrontTagPublic])
async def list_tags(
    organization_id: UUID,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
) -> Page[StorefrontTagPublic]:
    result = await storefront_service.list_storefront_tags(
        session,
        organization_id,
        pagination=pagination,
        name=name,
    )
    return Page.from_mapped(
        result,
        pagination,
        lambda tag: StorefrontTagPublic(id=tag.id, name=tag.name),
    )


@router.get("/locations/provinces", response_model=list[ProvincePublic])
async def list_provinces(
    session: SessionDep,
    name: str | None = None,
) -> list[ProvincePublic]:
    provinces = await location_service.list_provinces(session, name=name)
    return [ProvincePublic.model_validate(p) for p in provinces]


@router.get(
    "/locations/provinces/{province_id}/municipalities",
    response_model=list[MunicipalityPublic],
)
async def list_municipalities(
    province_id: UUID,
    session: SessionDep,
    name: str | None = None,
) -> list[MunicipalityPublic]:
    municipalities = await location_service.list_municipalities_for_province(
        session,
        province_id,
        name=name,
    )
    return [MunicipalityPublic.model_validate(m) for m in municipalities]


@router.get(
    "/locations/municipalities/{municipality_id}/neighborhoods",
    response_model=list[NeighborhoodPublic],
)
async def list_neighborhoods(
    municipality_id: UUID,
    session: SessionDep,
    name: str | None = None,
) -> list[NeighborhoodPublic]:
    neighborhoods = await location_service.list_neighborhoods_for_municipality(
        session,
        municipality_id,
        name=name,
    )
    return await location_service.enrich_neighborhoods(session, neighborhoods)


@router.post("/checkout", response_model=StorefrontCheckoutPublic, status_code=201)
async def checkout(
    body: StorefrontCheckoutCreate,
    organization_id: UUID,
    session: SessionDep,
) -> StorefrontCheckoutPublic:
    return await storefront_service.checkout_storefront(
        session,
        organization_id,
        body,
    )
