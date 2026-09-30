from __future__ import annotations

from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.events.types import (
    OrderItemCanceledEvent,
    OrderItemConsumedEvent,
    OrderItemDeliveredEvent,
    OrderStatusChangedEvent,
)
from app.lib.exceptions import raise_api_error
from app.lib.events import emit
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.utils import utc_now
from app.models.order.enums import OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.order.order_messaging import OrderMessaging
from app.models.organization.organization import Organization
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.schemas.messaging import OrderMessagingCreate, OrderMessagingUpdate
from app.schemas.order import OrderItemStatusUpdate
from app.schemas.pagination import PageResult, PaginationParams
from app.services import provider_seller_link as link_service
from app.services.order import item_status as item_status_service
from app.services.order.helpers import (
    attach_order_relations,
    derive_order_status,
    load_items_by_order_ids,
    order_search_clause,
)

def provider_order_visibility_clause(provider_organization_id: UUID):
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
    seller_organization_id: UUID | None = None,
) -> PageResult[Order]:
    if seller_organization_id is not None and not await link_service.has_active_link(
        session,
        provider_organization_id,
        seller_organization_id,
    ):
        raise_api_error("forbidden")

    stmt = select(Order).where(
        provider_order_visibility_clause(provider_organization_id)
    )
    if seller_organization_id is not None:
        stmt = stmt.where(Order.seller_organization_id == seller_organization_id)
    if status is not None:
        stmt = stmt.where(Order.status == status)
    clause = order_search_clause(search) if search else None
    if clause is not None:
        stmt = stmt.where(clause)
    stmt = stmt.order_by(Order.created_at.desc(), Order.id.desc())
    result = await paginate(session, stmt, pagination)
    await attach_order_relations(
        session,
        result.items,
        provider_organization_id=provider_organization_id,
    )
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
        raise_api_error("not_found")

    if not await link_service.has_active_link(
        session,
        provider_organization_id,
        order.seller_organization_id,
    ):
        raise_api_error("not_found")

    await attach_order_relations(
        session,
        [order],
        provider_organization_id=provider_organization_id,
    )
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
        raise_api_error("not_found")

    target = data.status

    for item in provider_items:
        item_status_service.assert_transition(item.status, target)

    now = utc_now()
    newly_transitioned: list[OrderItem] = []
    for item in provider_items:
        if item.status != target:
            item.status = target
            item.updated_at = now
            session.add(item)
            newly_transitioned.append(item)

    all_items_by_order = await load_items_by_order_ids(session, [order.id])
    all_items = all_items_by_order.get(order.id, [])
    # Refresh in-memory provider items into the full list for derivation
    provider_by_id = {item.id: item for item in provider_items}
    merged_items = [provider_by_id.get(item.id, item) for item in all_items]

    previous_status = order.status
    order.status = derive_order_status(merged_items)
    order.updated_at = now
    session.add(order)

    await session.flush()

    for item in newly_transitioned:
        if target == OrderItemStatus.canceled:
            await emit(
                OrderItemCanceledEvent(order_item_id=item.id),
                session=session,
                propagate_errors=True,
            )
        elif target == OrderItemStatus.delivered:
            await emit(
                OrderItemConsumedEvent(order_item_id=item.id),
                session=session,
                propagate_errors=True,
            )

    if previous_status != order.status:
        await emit(
            OrderStatusChangedEvent(order_id=order.id),
            session=session,
            propagate_errors=True,
        )

    await session.commit()
    await session.refresh(order)
    for item in provider_items:
        await session.refresh(item)

    if target == OrderItemStatus.delivered:
        for item in newly_transitioned:
            await emit(
                OrderItemDeliveredEvent(order_item_id=item.id),
                background=False,
            )

    await attach_order_relations(
        session,
        [order],
        provider_organization_id=provider_organization_id,
    )
    return order


async def create_order_messaging(
    session: AsyncSession,
    order_id: UUID,
    provider_organization_id: UUID,
    data: OrderMessagingCreate,
) -> Order:
    order = await get_order_for_provider(
        session,
        order_id,
        provider_organization_id,
    )
    if order.customer_neighborhood_id is None:
        raise_api_error("order_neighborhood_required")

    existing = await get_entity(
        session,
        OrderMessaging,
        required=False,
        order_id=order.id,
        provider_organization_id=provider_organization_id,
    )
    if existing is not None:
        raise_api_error("order_messaging_exists")

    provider = await get_entity(
        session,
        Organization,
        id=provider_organization_id,
    )
    line = OrderMessaging(
        order_id=order.id,
        provider_organization_id=provider_organization_id,
        provider_organization_name=provider.name,
        neighborhood_id=order.customer_neighborhood_id,
        neighborhood_name=order.customer_neighborhood_name or "",
        amount=data.price.amount,
        currency=data.price.currency,
    )
    session.add(line)
    await session.commit()
    await attach_order_relations(
        session,
        [order],
        provider_organization_id=provider_organization_id,
    )
    return order


async def update_order_messaging(
    session: AsyncSession,
    order_id: UUID,
    messaging_id: UUID,
    provider_organization_id: UUID,
    data: OrderMessagingUpdate,
) -> Order:
    order = await get_order_for_provider(
        session,
        order_id,
        provider_organization_id,
    )
    line = await get_entity(
        session,
        OrderMessaging,
        id=messaging_id,
        order_id=order.id,
        provider_organization_id=provider_organization_id,
    )
    line.amount = data.price.amount
    line.currency = data.price.currency
    line.updated_at = utc_now()
    session.add(line)
    await session.commit()
    await attach_order_relations(
        session,
        [order],
        provider_organization_id=provider_organization_id,
    )
    return order
