from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.schemas.pagination import Page
from app.schemas.product import ProductCreate, ProductPublic, ProductUpdate
from app.services import product as product_service

router = APIRouter(prefix="/products/provider", tags=["products"])


@router.get("/", response_model=Page[ProductPublic])
async def list_products(
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
    pagination: PaginationDep,
    name: str | None = None,
    tag_ids: Annotated[list[UUID] | None, Query()] = None,
) -> Page[ProductPublic]:
    result = await product_service.list_products_for_organization(
        session,
        organization.id,
        pagination=pagination,
        name=name,
        tag_ids=tag_ids,
    )
    return Page.from_mapped(result, pagination, ProductPublic.model_validate)


@router.get("/{product_id}", response_model=ProductPublic)
async def get_product(
    product_id: UUID,
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProductPublic:
    product = await product_service.get_product_for_organization(
        session,
        product_id,
        organization.id,
    )
    return ProductPublic.model_validate(product)


@router.post("/", response_model=ProductPublic, status_code=201)
async def create_product(
    body: ProductCreate,
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProductPublic:
    product = await product_service.create_product(session, organization.id, body)
    return ProductPublic.model_validate(product)


@router.patch("/{product_id}", response_model=ProductPublic)
async def patch_product(
    product_id: UUID,
    body: ProductUpdate,
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProductPublic:
    product = await product_service.update_product(
        session,
        product_id,
        organization.id,
        body,
    )
    return ProductPublic.model_validate(product)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await product_service.delete_product(session, product_id, organization.id)
    return Response(status_code=204)
