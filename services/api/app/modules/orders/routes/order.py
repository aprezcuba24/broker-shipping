from typing import Annotated
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

from app.lib.security.deps import get_tenant
from app.modules.orders.schemas import OrderCreate, OrderDetail
from app.modules.orders.services import OrderService
from app.modules.organization.models import Organization, OrganizationType

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[OrderDetail])
async def list_orders(
    service: FromDishka[OrderService],
    organization: Annotated[Organization, Depends(get_tenant())],
):
    return await service.list_for_organization(organization)


@router.post("/", response_model=OrderDetail, status_code=201)
async def create_order(
    body: OrderCreate,
    service: FromDishka[OrderService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.seller))],
):
    return await service.create_with_lines(body, organization)


@router.get("/{order_id}", response_model=OrderDetail)
async def get_order(
    order_id: UUID,
    service: FromDishka[OrderService],
    organization: Annotated[Organization, Depends(get_tenant())],
):
    return await service.get_or_404_detail(order_id, organization)


@router.post("/{order_id}/cancel", response_model=OrderDetail)
async def cancel_order(
    order_id: UUID,
    service: FromDishka[OrderService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.seller))],
):
    return await service.cancel_order(order_id, organization)


@router.post("/{order_id}/lines/{line_id}/cancel", response_model=OrderDetail)
async def cancel_order_line(
    order_id: UUID,
    line_id: UUID,
    service: FromDishka[OrderService],
    organization: Annotated[Organization, Depends(get_tenant())],
):
    return await service.cancel_line(order_id, line_id, organization)
