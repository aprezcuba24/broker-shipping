from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.exceptions import raise_api_error
from app.lib.utils import utc_now
from app.models.commission.commission import Commission
from app.models.commission.commission_amount import CommissionAmount
from app.models.order.commission_component import OrderItemCommissionComponent
from app.models.order.enums import Currency, OrderItemStatus
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
) -> Commission:
    commission_result = await session.execute(
        select(Commission)
        .where(
            Commission.order_id == order.id,
            Commission.provider_organization_id == provider_organization_id,
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
            is_paid=False,
        )
        session.add(commission)
        await session.flush()
    return commission


async def _add_amount(
    session: AsyncSession,
    *,
    commission: Commission,
    currency: Currency,
    delta: int,
) -> None:
    now = utc_now()
    amount_result = await session.execute(
        select(CommissionAmount)
        .where(
            CommissionAmount.commission_id == commission.id,
            CommissionAmount.currency == currency,
        )
        .with_for_update()
    )
    row = amount_result.scalar_one_or_none()
    if row is None:
        session.add(
            CommissionAmount(
                id=uuid4(),
                commission_id=commission.id,
                amount=delta,
                currency=currency,
            )
        )
        await session.flush()
    else:
        row.amount += delta
        row.updated_at = now
        session.add(row)

    commission.updated_at = now
    session.add(commission)


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
    commission: Commission | None = None

    if components:
        if all(component.commission_id is not None for component in components):
            return await session.get(Commission, components[0].commission_id)

        commission = await _find_or_create_unpaid_commission(
            session,
            order=order,
            provider_organization_id=item.provider_organization_id,
        )

        for component in components:
            if component.commission_id is not None:
                continue
            delta = component.unit_amount * item.quantity
            await _add_amount(
                session,
                commission=commission,
                currency=component.currency,
                delta=delta,
            )
            component.commission_id = commission.id
            component.updated_at = now
            session.add(component)

        # Keep legacy pointer on the item for list helpers / older clients.
        if item.commission_id is None:
            item.commission_id = commission.id
            item.updated_at = now
            session.add(item)
    else:
        if item.commission_id is not None:
            return await session.get(Commission, item.commission_id)

        commission = await _find_or_create_unpaid_commission(
            session,
            order=order,
            provider_organization_id=item.provider_organization_id,
        )
        await _add_amount(
            session,
            commission=commission,
            currency=item.commission_currency,
            delta=item_commission_amount(item),
        )
        item.commission_id = commission.id
        item.updated_at = now
        session.add(item)

    await session.commit()
    if commission is not None:
        await session.refresh(commission)
    await session.refresh(item)
    return commission
