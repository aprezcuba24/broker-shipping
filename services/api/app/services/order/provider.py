from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.utils import utc_now
from app.models.customer.customer import Customer
from app.models.order.enums import OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.schemas.order import OrderItemStatusUpdate
from app.schemas.pagination import PageResult, PaginationParams
from app.services import provider_seller_link as link_service
from app.services.order import item_status as item_status_service
from app.services.order.helpers import (
    attach_customers_to_orders,
    attach_items_and_totals,
    attach_order_view,
    derive_order_status,
    load_items_by_order_ids,
    order_search_clause,
)


def _provider_order_visibility_clause(provider_organization_id: UUID):
    return exists().where(
        OrderItem.order_id == Order.id,
        OrderItem.provider_organization_id == provider_organization_id,
        ProviderSellerLink.seller_organization_id == Order.seller_organization_id,
        ProviderSellerLink.provider_organization_id == provider_organization_id,
        ProviderSellerLink.is_active.is_(True),
    )


async def list_orders_for_provider(
    session: AsyncSession,
    provider_organization_id: UUID,
    *,
    pagination: PaginationParams,
    search: str | None = None,
    status: OrderStatus | None = None,
) -> PageResult[Order]:
    stmt = select(Order).where(
        _provider_order_visibility_clause(provider_organization_id)
    )
    if status is not None:
        stmt = stmt.where(Order.status == status)
    clause = order_search_clause(search) if search else None
    if clause is not None:
        stmt = stmt.join(Customer, Customer.id == Order.customer_id).where(clause)
    stmt = stmt.order_by(Order.created_at.desc(), Order.id.desc())
    result = await paginate(session, stmt, pagination)
    await attach_items_and_totals(
        session,
        result.items,
        provider_organization_id=provider_organization_id,
    )
    await attach_customers_to_orders(session, result.items)
    return result


async def get_order_for_provider(
    session: AsyncSession,
    order_id: UUID,
    provider_organization_id: UUID,
) -> Order:
    order = await get_entity(session, Order, id=order_id)
    has_provider_item = await session.scalar(
        select(
            exists().where(
                OrderItem.order_id == order.id,
                OrderItem.provider_organization_id == provider_organization_id,
            )
        )
    )
    if not has_provider_item:
        raise HTTPException(status_code=404, detail="Not found")

    if not await link_service.has_active_link(
        session,
        provider_organization_id,
        order.seller_organization_id,
    ):
        raise HTTPException(status_code=404, detail="Not found")

    await attach_items_and_totals(
        session,
        [order],
        provider_organization_id=provider_organization_id,
    )
    await attach_customers_to_orders(session, [order])
    return order


async def update_provider_items_status(
    session: AsyncSession,
    order_id: UUID,
    provider_organization_id: UUID,
    data: OrderItemStatusUpdate,
) -> Order:
    order = await get_order_for_provider(
        session,
        order_id,
        provider_organization_id,
    )

    result = await session.execute(
        select(OrderItem)
        .where(
            OrderItem.order_id == order.id,
            OrderItem.provider_organization_id == provider_organization_id,
        )
        .order_by(OrderItem.created_at, OrderItem.id)
        .with_for_update()
    )
    provider_items = list(result.scalars().all())
    if not provider_items:
        raise HTTPException(status_code=404, detail="Not found")

    target = data.status
    for item in provider_items:
        item_status_service.assert_transition(item.status, target)

    now = utc_now()
    for item in provider_items:
        if item.status != target:
            item.status = target
            item.updated_at = now
            session.add(item)

    all_items_by_order = await load_items_by_order_ids(session, [order.id])
    all_items = all_items_by_order.get(order.id, [])
    # Refresh in-memory provider items into the full list for derivation
    provider_by_id = {item.id: item for item in provider_items}
    merged_items = [provider_by_id.get(item.id, item) for item in all_items]

    order.status = derive_order_status(merged_items)
    order.updated_at = now
    session.add(order)

    await session.commit()
    await session.refresh(order)
    for item in provider_items:
        await session.refresh(item)
    return attach_order_view(order, provider_items)
