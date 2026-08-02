from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.models.order.enums import OrderStatus
from app.schemas.order import OrderItemStatusUpdate, OrderPublic
from app.schemas.pagination import Page
from app.services.order import provider as provider_order_service

router = APIRouter(prefix="/orders/provider", tags=["orders"])


@router.get("/", response_model=Page[OrderPublic])
async def list_orders(
    organization: ProviderOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    search: str | None = None,
    status: OrderStatus | None = None,
) -> Page[OrderPublic]:
    result = await provider_order_service.list_orders_for_provider(
        session,
        organization.id,
        pagination=pagination,
        search=search,
        status=status,
    )
    return Page.from_mapped(result, pagination, OrderPublic.model_validate)


@router.get("/{order_id}", response_model=OrderPublic)
async def get_order(
    order_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
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
    session: SessionDep,
) -> OrderPublic:
    order = await provider_order_service.update_provider_items_status(
        session,
        order_id,
        organization.id,
        body,
    )
    return OrderPublic.model_validate(order)
