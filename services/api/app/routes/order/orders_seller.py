from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import CurrentUserDep, SellerOrgDep
from app.schemas.order import OrderCreate, OrderPublic
from app.schemas.pagination import Page
from app.services.order import seller as seller_order_service

router = APIRouter(prefix="/orders/seller", tags=["orders"])


@router.get("/", response_model=Page[OrderPublic])
async def list_orders(
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
    pagination: PaginationDep,
) -> Page[OrderPublic]:
    result = await seller_order_service.list_orders_for_seller(
        session,
        organization.id,
        pagination=pagination,
    )
    return Page.from_mapped(result, pagination, OrderPublic.model_validate)


@router.get("/{order_id}", response_model=OrderPublic)
async def get_order(
    order_id: UUID,
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrderPublic:
    order = await seller_order_service.get_order_for_seller(
        session,
        order_id,
        organization.id,
    )
    return OrderPublic.model_validate(order)


@router.post("/", response_model=OrderPublic, status_code=201)
async def create_order(
    body: OrderCreate,
    user: CurrentUserDep,
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrderPublic:
    order = await seller_order_service.create_order(
        session,
        user,
        organization.id,
        body,
    )
    return OrderPublic.model_validate(order)
