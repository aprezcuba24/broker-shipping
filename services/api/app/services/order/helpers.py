from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.schemas.order import OrderCurrencyTotal


def compute_order_totals(items: list[OrderItem]) -> list[OrderCurrencyTotal]:
    amounts: dict[Currency, Decimal] = defaultdict(lambda: Decimal("0"))
    for item in items:
        amounts[item.currency] += item.seller_provider_price * item.quantity
    return [
        OrderCurrencyTotal(currency=currency, amount=amount)
        for currency, amount in sorted(amounts.items(), key=lambda pair: pair[0].value)
    ]


def attach_order_view(order: Order, items: list[OrderItem]) -> Order:
    object.__setattr__(order, "items", items)
    object.__setattr__(order, "totals", compute_order_totals(items))
    return order


def derive_order_status(items: list[OrderItem]) -> OrderStatus:
    if not items:
        return OrderStatus.created

    statuses = {item.status for item in items}
    if statuses == {OrderItemStatus.canceled}:
        return OrderStatus.canceled
    if statuses <= {OrderItemStatus.delivered, OrderItemStatus.canceled}:
        return OrderStatus.finished
    if statuses & {OrderItemStatus.reviewed, OrderItemStatus.sent}:
        return OrderStatus.processing
    if statuses == {OrderItemStatus.created}:
        return OrderStatus.created
    return OrderStatus.processing


async def load_items_by_order_ids(
    session: AsyncSession,
    order_ids: list[UUID],
    *,
    provider_organization_id: UUID | None = None,
) -> dict[UUID, list[OrderItem]]:
    if not order_ids:
        return {}
    stmt = select(OrderItem).where(col(OrderItem.order_id).in_(order_ids))
    if provider_organization_id is not None:
        stmt = stmt.where(
            OrderItem.provider_organization_id == provider_organization_id
        )
    stmt = stmt.order_by(OrderItem.created_at, OrderItem.id)
    result = await session.execute(stmt)
    items_by_order: dict[UUID, list[OrderItem]] = defaultdict(list)
    for item in result.scalars().all():
        items_by_order[item.order_id].append(item)
    return dict(items_by_order)


async def attach_items_and_totals(
    session: AsyncSession,
    orders: list[Order],
    *,
    provider_organization_id: UUID | None = None,
) -> None:
    items_by_order = await load_items_by_order_ids(
        session,
        [order.id for order in orders],
        provider_organization_id=provider_organization_id,
    )
    for order in orders:
        attach_order_view(order, items_by_order.get(order.id, []))
