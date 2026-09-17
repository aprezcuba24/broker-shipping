from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.schemas.pagination import Page
from app.schemas.product_reception import (
    ProductReceptionCreate,
    ProductReceptionPublic,
)
from app.services import product_reception as reception_service

router = APIRouter(prefix="/product-receptions/provider", tags=["product-receptions"])


@router.get("/", response_model=Page[ProductReceptionPublic])
async def list_receptions(
    organization: ProviderOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
) -> Page[ProductReceptionPublic]:
    result = await reception_service.list_receptions_for_organization(
        session,
        organization.id,
        pagination=pagination,
    )
    return Page.from_mapped(result, pagination, ProductReceptionPublic.model_validate)


@router.get("/{reception_id}", response_model=ProductReceptionPublic)
async def get_reception(
    reception_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> ProductReceptionPublic:
    reception = await reception_service.get_reception_for_organization(
        session,
        reception_id,
        organization.id,
    )
    return ProductReceptionPublic.model_validate(reception)


@router.post("/", response_model=ProductReceptionPublic, status_code=201)
async def create_reception(
    body: ProductReceptionCreate,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> ProductReceptionPublic:
    reception = await reception_service.create_reception(
        session,
        organization.id,
        body,
    )
    return ProductReceptionPublic.model_validate(reception)
