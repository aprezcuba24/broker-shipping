from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import PublicSellerOrgDep
from app.schemas.pagination import Page
from app.schemas.storefront import (
    StorefrontProductPublic,
    StorefrontTagPublic,
    storefront_product_to_public,
)
from app.services.store import products as store_products_service

router = APIRouter()


@router.get("/products", response_model=Page[StorefrontProductPublic])
async def list_products(
    organization: PublicSellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    tag_id: UUID | None = None,
) -> Page[StorefrontProductPublic]:
    result = await store_products_service.list_storefront_products(
        session,
        organization.id,
        pagination=pagination,
        name=name,
        tag_id=tag_id,
    )
    return Page.from_mapped(result, pagination, storefront_product_to_public)


@router.get("/products/{product_id}", response_model=StorefrontProductPublic)
async def get_product(
    product_id: UUID,
    organization: PublicSellerOrgDep,
    session: SessionDep,
) -> StorefrontProductPublic:
    product = await store_products_service.get_storefront_product(
        session,
        product_id,
        organization.id,
    )
    return storefront_product_to_public(product)


@router.get("/tags", response_model=Page[StorefrontTagPublic])
async def list_tags(
    organization: PublicSellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
) -> Page[StorefrontTagPublic]:
    result = await store_products_service.list_storefront_tags(
        session,
        organization.id,
        pagination=pagination,
        name=name,
    )
    return Page.from_mapped(result, pagination, StorefrontTagPublic.model_validate)
