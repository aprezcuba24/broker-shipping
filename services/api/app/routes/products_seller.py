from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import CurrentUserDep, OptionalSellerOrgDep
from app.schemas.pagination import Page
from app.schemas.product import ProductPublic, product_to_public
from app.services import seller_product as seller_product_service

router = APIRouter(prefix="/products/seller", tags=["products"])


@router.get("/", response_model=Page[ProductPublic])
async def list_products(
    user: CurrentUserDep,
    organization: OptionalSellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    provider_id: UUID | None = None,
) -> Page[ProductPublic]:
    seller_org_id = organization.id if organization is not None else None
    result = await seller_product_service.list_accessible_products(
        session,
        user,
        pagination=pagination,
        seller_organization_id=seller_org_id,
        name=name,
        provider_id=provider_id,
    )
    return Page.from_mapped(result, pagination, product_to_public)


@router.get("/{product_id}", response_model=ProductPublic)
async def get_product(
    product_id: UUID,
    user: CurrentUserDep,
    organization: OptionalSellerOrgDep,
    session: SessionDep,
) -> ProductPublic:
    seller_org_id = organization.id if organization is not None else None
    product = await seller_product_service.get_accessible_product(
        session,
        product_id,
        user,
        seller_organization_id=seller_org_id,
    )
    return product_to_public(product)
