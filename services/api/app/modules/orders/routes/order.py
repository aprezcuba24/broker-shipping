from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter

from app.lib.security import require_user_or_api_key
from app.modules.orders.schemas import OrderCreate, OrderDetail
from app.modules.orders.services import OrderService
from app.modules.organization.models import Organization, OrganizationType

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[OrderDetail])
@require_user_or_api_key
async def list_orders(
    service: FromDishka[OrderService],
    organization: Organization,
):
    return await service.list_for_organization(organization)


@router.post("/", response_model=OrderDetail, status_code=201)
@require_user_or_api_key(OrganizationType.seller)
async def create_order(
    body: OrderCreate,
    service: FromDishka[OrderService],
    organization: Organization,
):
    return await service.create_with_lines(body, organization)


@router.get("/{order_id}", response_model=OrderDetail)
@require_user_or_api_key
async def get_order(
    order_id: UUID,
    service: FromDishka[OrderService],
    organization: Organization,
):
    return await service.get_or_404_detail(order_id, organization)


@router.post("/{order_id}/cancel", response_model=OrderDetail)
@require_user_or_api_key(OrganizationType.seller)
async def cancel_order(
    order_id: UUID,
    service: FromDishka[OrderService],
    organization: Organization,
):
    return await service.cancel_order(order_id, organization)


@router.post("/{order_id}/lines/{line_id}/cancel", response_model=OrderDetail)
@require_user_or_api_key
async def cancel_order_line(
    order_id: UUID,
    line_id: UUID,
    service: FromDishka[OrderService],
    organization: Organization,
):
    return await service.cancel_line(order_id, line_id, organization)
