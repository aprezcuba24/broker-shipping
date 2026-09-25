from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.exceptions import raise_api_error
from app.models.customer.customer import Customer
from app.models.order.enums import OrderStatus
from app.models.order.order import Order
from app.types import PurchaseTier


def purchase_tier_from_count(count: int) -> PurchaseTier:
    if count <= 0:
        return 0
    if count < 5:
        return 1
    if count < 10:
        return 5
    return 10


async def count_finished_orders_for_phone(
    session: AsyncSession,
    phone: str,
) -> int:
    result = await session.scalar(
        select(func.count(Order.id))
        .join(Customer, Customer.id == Order.customer_id)
        .where(
            Customer.phone == phone,
            Order.status == OrderStatus.finished,
        )
    )
    return int(result or 0)


async def refresh_purchase_tier_for_phone(
    session: AsyncSession,
    phone: str,
) -> PurchaseTier:
    count = await count_finished_orders_for_phone(session, phone)
    tier = purchase_tier_from_count(count)
    await session.execute(
        update(Customer)
        .where(Customer.phone == phone)
        .values(purchase_tier=tier)
    )
    return tier


async def refresh_purchase_tier_for_order(
    session: AsyncSession,
    order_id: UUID,
) -> PurchaseTier | None:
    order = await session.get(Order, order_id)
    if order is None:
        raise_api_error("not_found")
    customer = await session.get(Customer, order.customer_id)
    if customer is None:
        raise_api_error("not_found")
    return await refresh_purchase_tier_for_phone(session, customer.phone)
