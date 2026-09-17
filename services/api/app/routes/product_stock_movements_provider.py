from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.models.product_stock_movement.enums import StockMovementKind
from app.schemas.pagination import Page
from app.schemas.product_stock_movement import (
    ProductStockMovementCreate,
    ProductStockMovementPublic,
)
from app.services import product_stock_movement as movement_service

router = APIRouter(
    prefix="/product-stock-movements/provider",
    tags=["product-stock-movements"],
)


@router.get("/", response_model=Page[ProductStockMovementPublic])
async def list_movements(
    organization: ProviderOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    kind: StockMovementKind | None = None,
) -> Page[ProductStockMovementPublic]:
    result = await movement_service.list_movements_for_organization(
        session,
        organization.id,
        pagination=pagination,
        kind=kind,
    )
    return Page.from_mapped(
        result,
        pagination,
        ProductStockMovementPublic.model_validate,
    )


@router.get("/{movement_id}", response_model=ProductStockMovementPublic)
async def get_movement(
    movement_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> ProductStockMovementPublic:
    movement = await movement_service.get_movement_for_organization(
        session,
        movement_id,
        organization.id,
    )
    return ProductStockMovementPublic.model_validate(movement)


@router.post("/", response_model=ProductStockMovementPublic, status_code=201)
async def create_movement(
    body: ProductStockMovementCreate,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> ProductStockMovementPublic:
    movement = await movement_service.create_movement(
        session,
        organization.id,
        body,
    )
    return ProductStockMovementPublic.model_validate(movement)
