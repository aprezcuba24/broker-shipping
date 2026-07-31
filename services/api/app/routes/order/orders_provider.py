from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.schemas.order import OrderItemStatusUpdate, OrderPublic
from app.schemas.pagination import Page
from app.services.order import provider as provider_order_service

router = APIRouter(prefix="/orders/provider", tags=["orders"])


@router.get("/", response_model=Page[OrderPublic])
async def list_orders(
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
    pagination: PaginationDep,
) -> Page[OrderPublic]:
    result = await provider_order_service.list_orders_for_provider(
        session,
        organization.id,
        pagination=pagination,
    )
    return Page.from_mapped(result, pagination, OrderPublic.model_validate)


@router.get("/{order_id}", response_model=OrderPublic)
async def get_order(
    order_id: UUID,
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrderPublic:
    order = await provider_order_service.get_order_for_provider(
        session,
        order_id,
        organization.id,
    )
    return OrderPublic.model_validate(order)


@router.patch("/{order_id}/items", response_model=OrderPublic)
async def update_items_status(
    order_id: UUID,
    body: OrderItemStatusUpdate,
    organization: ProviderOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrderPublic:
    order = await provider_order_service.update_provider_items_status(
        session,
        order_id,
        organization.id,
        body,
    )
    return OrderPublic.model_validate(order)
