from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.models.customer.customer import Customer
from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.schemas.order import OrderCurrencyTotal
from app.services.customer.helpers import attach_addresses_to_customers

_NIL_UUID = UUID(int=0)


def compute_order_totals(items: list[OrderItem]) -> list[OrderCurrencyTotal]:
    amounts: dict[Currency, int] = defaultdict(int)
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


async def attach_customers_to_orders(
    session: AsyncSession,
    orders: list[Order],
) -> None:
    customer_ids = list(
        {
            order.customer_id
            for order in orders
            if order.customer_id and order.customer_id != _NIL_UUID
        }
    )
    customers_by_id: dict[UUID, Customer] = {}
    if customer_ids:
        result = await session.execute(
            select(Customer).where(col(Customer.id).in_(customer_ids))
        )
        customers = list(result.scalars().all())
        await attach_addresses_to_customers(session, customers)
        customers_by_id = {customer.id: customer for customer in customers}

    for order in orders:
        object.__setattr__(
            order,
            "customer",
            customers_by_id.get(order.customer_id),
        )


def order_search_clause(search: str):
    term = search.strip()
    if not term:
        return None

    digits_only = term.isdigit()
    has_letter = any(c.isalpha() for c in term)
    has_digit = any(c.isdigit() for c in term)

    if digits_only:
        if len(term) <= 11:
            return or_(
                Customer.ci == term,
                col(Customer.phone).ilike(f"%{term}%"),
            )
        return col(Customer.phone).ilike(f"%{term}%")

    if has_letter and has_digit:
        return col(Order.code).ilike(f"%{term}%")

    if has_letter and not has_digit:
        return col(Customer.name).ilike(f"%{term}%")

    return or_(
        col(Order.code).ilike(f"%{term}%"),
        col(Customer.name).ilike(f"%{term}%"),
        col(Customer.phone).ilike(f"%{term}%"),
        Customer.ci == term,
    )
