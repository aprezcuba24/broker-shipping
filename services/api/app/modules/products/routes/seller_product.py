from typing import Annotated
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

from app.lib.security.deps import get_organization, get_user
from app.modules.organization.models import Organization, OrganizationType
from app.modules.products.models import Product, ProductListFilters, product_list_filters
from app.modules.products.services import SellerProductService
from app.modules.user.models import User

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[Product])
async def list_products(
    service: FromDishka[SellerProductService],
    user: Annotated[User, Depends(get_user)],
    organization: Annotated[
        Organization | None,
        Depends(get_organization(OrganizationType.seller, required=False)),
    ],
    filters: Annotated[ProductListFilters, Depends(product_list_filters)],
):
    organization_id = organization.id if organization is not None else None
    return await service.list_accessible(
        user.id,
        organization_id=organization_id,
        filters=filters,
    )


@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: UUID,
    service: FromDishka[SellerProductService],
    user: Annotated[User, Depends(get_user)],
    organization: Annotated[
        Organization | None,
        Depends(get_organization(OrganizationType.seller, required=False)),
    ],
):
    organization_id = organization.id if organization is not None else None
    return await service.get_accessible(
        product_id,
        user.id,
        organization_id=organization_id,
        detail="Product not found",
    )
