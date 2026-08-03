from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.utils import utc_now
from app.models.commission.commission import Commission
from app.models.order.enums import OrderItemStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem


def item_commission_amount(item: OrderItem) -> int:
    return item.seller_commission * item.quantity


async def assign_delivered_item(
    session: AsyncSession,
    order_item_id: UUID,
) -> Commission | None:
    """Find or create an unpaid commission and link the delivered order item.

    Idempotent: if the item already has ``commission_id``, returns that commission
    without changing ``amount``.
    """
    result = await session.execute(
        select(OrderItem)
        .where(OrderItem.id == order_item_id)
        .with_for_update()
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Not found")

    if item.commission_id is not None:
        return await session.get(Commission, item.commission_id)

    if item.status != OrderItemStatus.delivered:
        return None

    order = await session.get(Order, item.order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Not found")

    delta = item_commission_amount(item)
    now = utc_now()

    commission_result = await session.execute(
        select(Commission)
        .where(
            Commission.order_id == item.order_id,
            Commission.provider_organization_id == item.provider_organization_id,
            Commission.currency == item.currency,
            Commission.is_paid.is_(False),
        )
        .with_for_update()
    )
    commission = commission_result.scalar_one_or_none()

    if commission is None:
        commission = Commission(
            id=uuid4(),
            order_id=item.order_id,
            provider_organization_id=item.provider_organization_id,
            seller_organization_id=order.seller_organization_id,
            amount=delta,
            currency=item.currency,
            is_paid=False,
        )
        session.add(commission)
    else:
        commission.amount += delta
        commission.updated_at = now
        session.add(commission)

    item.commission_id = commission.id
    item.updated_at = now
    session.add(item)

    await session.commit()
    await session.refresh(commission)
    await session.refresh(item)
    return commission
