from __future__ import annotations

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.utils import utc_now
from app.models.commission.commission import Commission
from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.schemas.dashboard import (
    CommissionSummaryPublic,
    CurrencyAmount,
    OrderSummaryPublic,
    StatusCount,
)
from app.schemas.order import OrderCurrencyTotal
from app.services.order.helpers import (
    attach_customers_to_orders,
    attach_items_and_totals,
    compute_order_totals,
)
from app.types import DashboardPeriod

_PERIOD_DAYS: dict[str, int] = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
}

_RECENT_LIMIT = 5

_ORDER_STATUSES = list(OrderStatus)
_ITEM_STATUSES = list(OrderItemStatus)
_PENDING_ITEM_STATUSES = {
    OrderItemStatus.created,
    OrderItemStatus.reviewed,
    OrderItemStatus.sent,
}


def resolve_period_start(period: DashboardPeriod) -> datetime | None:
    if period == "all":
        return None
    days = _PERIOD_DAYS[period]
    return utc_now() - timedelta(days=days)


def fill_status_counts(
    rows: list[tuple[str, int]],
    all_statuses: list,
) -> list[StatusCount]:
    counts = {str(status): count for status, count in rows}
    return [
        StatusCount(status=status.value, count=counts.get(status.value, 0))
        for status in all_statuses
    ]


def currency_amounts_from_rows(
    rows: list[tuple[Currency, int]],
) -> list[CurrencyAmount]:
    return [
        CurrencyAmount(currency=currency, amount=int(amount or 0))
        for currency, amount in sorted(rows, key=lambda pair: pair[0].value)
        if amount
    ]


def apply_created_at_since(stmt: Select, column, period_start: datetime | None) -> Select:
    if period_start is None:
        return stmt
    return stmt.where(column >= period_start)


async def count_orders_by_status(
    session: AsyncSession,
    *,
    base_where,
    period_start: datetime | None,
) -> list[StatusCount]:
    stmt = select(Order.status, func.count()).where(base_where).group_by(Order.status)
    stmt = apply_created_at_since(stmt, Order.created_at, period_start)
    result = await session.execute(stmt)
    return fill_status_counts(
        [(row[0], row[1]) for row in result.all()],
        _ORDER_STATUSES,
    )


async def sum_sales_by_currency(
    session: AsyncSession,
    *,
    order_filter,
    item_extra_filter=None,
    period_start: datetime | None,
) -> list[CurrencyAmount]:
    stmt = (
        select(
            OrderItem.currency,
            func.coalesce(
                func.sum(OrderItem.seller_provider_price * OrderItem.quantity),
                0,
            ),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            order_filter,
            Order.status != OrderStatus.canceled,
        )
        .group_by(OrderItem.currency)
    )
    if item_extra_filter is not None:
        stmt = stmt.where(item_extra_filter)
    stmt = apply_created_at_since(stmt, Order.created_at, period_start)
    result = await session.execute(stmt)
    return currency_amounts_from_rows(list(result.all()))


async def count_items_by_status(
    session: AsyncSession,
    *,
    order_filter,
    item_extra_filter=None,
    period_start: datetime | None,
) -> list[StatusCount]:
    stmt = (
        select(OrderItem.status, func.count())
        .join(Order, Order.id == OrderItem.order_id)
        .where(order_filter)
        .group_by(OrderItem.status)
    )
    if item_extra_filter is not None:
        stmt = stmt.where(item_extra_filter)
    stmt = apply_created_at_since(stmt, Order.created_at, period_start)
    result = await session.execute(stmt)
    return fill_status_counts(
        [(row[0], row[1]) for row in result.all()],
        _ITEM_STATUSES,
    )


async def sum_commissions(
    session: AsyncSession,
    *,
    org_filter,
    is_paid: bool,
    period_start: datetime | None,
) -> list[CurrencyAmount]:
    stmt = (
        select(
            Commission.currency,
            func.coalesce(func.sum(Commission.amount), 0),
        )
        .where(org_filter, Commission.is_paid.is_(is_paid))
        .group_by(Commission.currency)
    )
    if is_paid and period_start is not None:
        stmt = stmt.where(Commission.paid_at >= period_start)
    elif not is_paid:
        # Pending = current unpaid balance (not period-scoped).
        pass
    result = await session.execute(stmt)
    return currency_amounts_from_rows(list(result.all()))


async def list_recent_orders(
    session: AsyncSession,
    *,
    base_where,
    provider_organization_id: UUID | None = None,
) -> list[OrderSummaryPublic]:
    stmt = (
        select(Order)
        .where(base_where)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(_RECENT_LIMIT)
    )
    result = await session.execute(stmt)
    orders = list(result.scalars().all())
    await attach_items_and_totals(
        session,
        orders,
        provider_organization_id=provider_organization_id,
    )
    await attach_customers_to_orders(session, orders)

    summaries: list[OrderSummaryPublic] = []
    for order in orders:
        items = getattr(order, "items", [])
        totals = getattr(order, "totals", None) or compute_order_totals(items)
        customer = getattr(order, "customer", None)
        summaries.append(
            OrderSummaryPublic(
                id=order.id,
                code=order.code,
                status=order.status,
                created_at=order.created_at,
                totals=[
                    OrderCurrencyTotal(currency=t.currency, amount=t.amount)
                    for t in totals
                ],
                customer_name=customer.name if customer else None,
            )
        )
    return summaries


async def list_recent_pending_commissions(
    session: AsyncSession,
    *,
    org_filter,
) -> list[CommissionSummaryPublic]:
    stmt = (
        select(Commission)
        .where(org_filter, Commission.is_paid.is_(False))
        .order_by(Commission.created_at.desc(), Commission.id.desc())
        .limit(_RECENT_LIMIT)
    )
    result = await session.execute(stmt)
    return [
        CommissionSummaryPublic(
            id=c.id,
            amount=c.amount,
            currency=c.currency,
            provider_organization_id=c.provider_organization_id,
            seller_organization_id=c.seller_organization_id,
            created_at=c.created_at,
        )
        for c in result.scalars().all()
    ]


def orders_active_from_status_counts(counts: list[StatusCount]) -> int:
    active = {OrderStatus.created.value, OrderStatus.processing.value}
    return sum(c.count for c in counts if c.status in active)


def items_pending_from_status_counts(counts: list[StatusCount]) -> int:
    pending = {s.value for s in _PENDING_ITEM_STATUSES}
    return sum(c.count for c in counts if c.status in pending)
