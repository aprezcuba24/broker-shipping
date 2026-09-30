from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.exceptions import raise_api_error
from app.lib.utils import utc_now
from app.models.commission.commission import Commission
from app.models.order.commission_component import OrderItemCommissionComponent
from app.models.order.enums import OrderItemStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem


def item_commission_amount(item: OrderItem) -> int:
    """Legacy total when no commission components exist."""
    return item.seller_commission * item.quantity


async def _find_or_create_unpaid_commission(
    session: AsyncSession,
    *,
    order: Order,
    provider_organization_id: UUID,
    currency,
    delta: int,
) -> Commission:
    now = utc_now()
    commission_result = await session.execute(
        select(Commission)
        .where(
            Commission.order_id == order.id,
            Commission.provider_organization_id == provider_organization_id,
            Commission.currency == currency,
            Commission.is_paid.is_(False),
        )
        .with_for_update()
    )
    commission = commission_result.scalar_one_or_none()

    if commission is None:
        commission = Commission(
            id=uuid4(),
            order_id=order.id,
            provider_organization_id=provider_organization_id,
            seller_organization_id=order.seller_organization_id,
            amount=delta,
            currency=currency,
            is_paid=False,
        )
        session.add(commission)
    else:
        commission.amount += delta
        commission.updated_at = now
        session.add(commission)
    return commission


async def assign_delivered_item(
    session: AsyncSession,
    order_item_id: UUID,
) -> Commission | None:
    """Find or create unpaid commission(s) and link the delivered order item.

    Idempotent: if the item already has ``commission_id`` (legacy) or all of its
    components already have ``commission_id``, returns without changing amounts.
    """
    result = await session.execute(
        select(OrderItem)
        .where(OrderItem.id == order_item_id)
        .with_for_update()
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise_api_error("not_found")

    if item.status != OrderItemStatus.delivered:
        return None

    order = await session.get(Order, item.order_id)
    if order is None:
        raise_api_error("not_found")

    components_result = await session.execute(
        select(OrderItemCommissionComponent)
        .where(OrderItemCommissionComponent.order_item_id == item.id)
        .with_for_update()
    )
    components = list(components_result.scalars().all())

    now = utc_now()
    last_commission: Commission | None = None

    if components:
        if all(component.commission_id is not None for component in components):
            return await session.get(Commission, components[0].commission_id)

        for component in components:
            if component.commission_id is not None:
                last_commission = await session.get(
                    Commission, component.commission_id
                )
                continue
            delta = component.unit_amount * item.quantity
            commission = await _find_or_create_unpaid_commission(
                session,
                order=order,
                provider_organization_id=item.provider_organization_id,
                currency=component.currency,
                delta=delta,
            )
            await session.flush()
            component.commission_id = commission.id
            component.updated_at = now
            session.add(component)
            last_commission = commission

        # Keep legacy pointer on the item for list helpers / older clients.
        if item.commission_id is None and last_commission is not None:
            item.commission_id = last_commission.id
            item.updated_at = now
            session.add(item)
    else:
        if item.commission_id is not None:
            return await session.get(Commission, item.commission_id)

        delta = item_commission_amount(item)
        last_commission = await _find_or_create_unpaid_commission(
            session,
            order=order,
            provider_organization_id=item.provider_organization_id,
            currency=item.commission_currency,
            delta=delta,
        )
        await session.flush()
        item.commission_id = last_commission.id
        item.updated_at = now
        session.add(item)

    await session.commit()
    if last_commission is not None:
        await session.refresh(last_commission)
    await session.refresh(item)
    return last_commission
