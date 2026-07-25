from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.security.deps import CurrentUserDep, OptionalSellerOrgDep
from app.schemas.product import ProductPublic
from app.services import seller_product as seller_product_service

router = APIRouter(prefix="/products/seller", tags=["products"])


@router.get("/", response_model=list[ProductPublic])
async def list_products(
    user: CurrentUserDep,
    organization: OptionalSellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
    name: str | None = None,
    provider_id: UUID | None = None,
) -> list[ProductPublic]:
    seller_org_id = organization.id if organization is not None else None
    products = await seller_product_service.list_accessible_products(
        session,
        user.id,
        seller_organization_id=seller_org_id,
        name=name,
        provider_id=provider_id,
    )
    return [ProductPublic.model_validate(p) for p in products]


@router.get("/{product_id}", response_model=ProductPublic)
async def get_product(
    product_id: UUID,
    user: CurrentUserDep,
    organization: OptionalSellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProductPublic:
    seller_org_id = organization.id if organization is not None else None
    product = await seller_product_service.get_accessible_product(
        session,
        product_id,
        user.id,
        seller_organization_id=seller_org_id,
    )
    return ProductPublic.model_validate(product)
