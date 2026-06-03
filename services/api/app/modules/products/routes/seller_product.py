from typing import Annotated
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

from app.lib.security import require_user
from app.lib.security.dependencies import seller_organization_filter
from app.modules.organization.models import OrganizationType
from app.modules.products.models import Product, ProductListFilters, product_list_filters
from app.modules.products.services import SellerProductService
from app.modules.user.models import User

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[Product])
@require_user(OrganizationType.seller, organization_required=False)
async def list_products(
    service: FromDishka[SellerProductService],
    user: User,
    organization_id: Annotated[UUID | None, Depends(seller_organization_filter)],
    filters: Annotated[ProductListFilters, Depends(product_list_filters)],
):
    return await service.list_accessible(
        user.id,
        organization_id=organization_id,
        filters=filters,
    )


@router.get("/{product_id}", response_model=Product)
@require_user(OrganizationType.seller, organization_required=False)
async def get_product(
    product_id: UUID,
    service: FromDishka[SellerProductService],
    user: User,
    organization_id: Annotated[UUID | None, Depends(seller_organization_filter)],
):
    return await service.get_accessible(
        product_id,
        user.id,
        organization_id=organization_id,
        detail="Product not found",
    )
