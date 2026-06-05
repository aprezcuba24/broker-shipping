from typing import Annotated, Any
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Body, Depends, Response

from app.lib.security.deps import get_tenant
from app.modules.organization.models import Organization, OrganizationType
from app.modules.products.models import Product, ProductCreate, ProductListFilters, product_list_filters
from app.modules.products.services import ProviderProductService

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[Product])
async def list_products(
    service: FromDishka[ProviderProductService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.provider))],
    filters: Annotated[ProductListFilters, Depends(product_list_filters)],
):
    return await service.list_for_organization(organization.id, filters=filters)


@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: UUID,
    service: FromDishka[ProviderProductService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.provider))],
):
    return await service.get_or_404_for_organization(
        product_id,
        organization.id,
        detail="Product not found",
    )


@router.post("/", response_model=Product, status_code=201)
async def create_product(
    body: ProductCreate,
    service: FromDishka[ProviderProductService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.provider))],
):
    entity = Product(
        name=body.name,
        category_id=body.category_id,
        price=body.price,
        organization_id=organization.id,
    )
    return await service.create(entity)


@router.patch("/{product_id}", response_model=Product)
async def patch_product(
    product_id: UUID,
    payload: Annotated[dict[str, Any], Body(...)],
    service: FromDishka[ProviderProductService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.provider))],
):
    await service.get_or_404_for_organization(
        product_id,
        organization.id,
        detail="Product not found",
    )
    return await service.get_or_404(
        entity=await service.patch(
            product_id,
            payload,
            allowed_keys=ProviderProductService.patch_allowed_keys(),
        ),
        detail="Product not found",
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    service: FromDishka[ProviderProductService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.provider))],
):
    await service.get_or_404_for_organization(
        product_id,
        organization.id,
        detail="Product not found",
    )
    await service.delete(product_id)
    return Response(status_code=204)
