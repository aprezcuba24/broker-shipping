from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.models.commission.commission import Commission
from app.models.commission.commission_amount import CommissionAmount
from app.models.order.commission_component import (
    CommissionComponentKind,
    OrderItemCommissionComponent,
)
from app.models.order.order_item import OrderItem
from app.schemas.commission import CommissionComponentPublic
from app.schemas.money import Money


def attach_order_item_ids(commission: Commission, order_item_ids: list[UUID]) -> Commission:
    object.__setattr__(commission, "order_item_ids", order_item_ids)
    return commission


def attach_components(
    commission: Commission,
    components: list[CommissionComponentPublic],
) -> Commission:
    object.__setattr__(commission, "components", components)
    return commission


def attach_amounts(commission: Commission, amounts: list[Money]) -> Commission:
    object.__setattr__(commission, "amounts", amounts)
    return commission


async def load_amounts_by_commission(
    session: AsyncSession,
    commission_ids: list[UUID],
) -> dict[UUID, list[Money]]:
    if not commission_ids:
        return {}

    result = await session.execute(
        select(CommissionAmount)
        .where(col(CommissionAmount.commission_id).in_(commission_ids))
        .order_by(CommissionAmount.currency, CommissionAmount.id)
    )
    by_commission: dict[UUID, list[Money]] = defaultdict(list)
    for row in result.scalars().all():
        by_commission[row.commission_id].append(
            Money(amount=row.amount, currency=row.currency)
        )
    return dict(by_commission)


async def load_order_item_ids_by_commission(
    session: AsyncSession,
    commission_ids: list[UUID],
) -> dict[UUID, list[UUID]]:
    if not commission_ids:
        return {}

    by_commission: dict[UUID, list[UUID]] = defaultdict(list)

    component_result = await session.execute(
        select(OrderItemCommissionComponent.order_item_id, OrderItemCommissionComponent.commission_id)
        .where(col(OrderItemCommissionComponent.commission_id).in_(commission_ids))
    )
    for item_id, commission_id in component_result.all():
        if commission_id is not None and item_id not in by_commission[commission_id]:
            by_commission[commission_id].append(item_id)

    legacy_result = await session.execute(
        select(OrderItem.id, OrderItem.commission_id)
        .where(col(OrderItem.commission_id).in_(commission_ids))
        .order_by(OrderItem.created_at, OrderItem.id)
    )
    for item_id, commission_id in legacy_result.all():
        if commission_id is not None and item_id not in by_commission[commission_id]:
            by_commission[commission_id].append(item_id)

    return dict(by_commission)


def _component_to_public(
    component: OrderItemCommissionComponent,
    item: OrderItem,
) -> CommissionComponentPublic:
    line_amount = component.unit_amount * item.quantity
    unit_provider_price = None
    seller_provider_price = None
    if component.kind == CommissionComponentKind.price_markup:
        unit_provider_price = Money(
            amount=item.unit_provider_price,
            currency=item.currency,
        )
        seller_provider_price = Money(
            amount=item.seller_provider_price,
            currency=item.currency,
        )
    return CommissionComponentPublic(
        order_item_id=item.id,
        product_name=item.product_name,
        quantity=item.quantity,
        kind=component.kind,
        unit_amount=Money(
            amount=component.unit_amount,
            currency=component.currency,
        ),
        line_amount=Money(amount=line_amount, currency=component.currency),
        unit_provider_price=unit_provider_price,
        seller_provider_price=seller_provider_price,
    )


def _legacy_component_from_item(item: OrderItem) -> CommissionComponentPublic | None:
    if item.seller_commission <= 0:
        return None
    line_amount = item.seller_commission * item.quantity
    return CommissionComponentPublic(
        order_item_id=item.id,
        product_name=item.product_name,
        quantity=item.quantity,
        kind=CommissionComponentKind.provider_commission,
        unit_amount=Money(
            amount=item.seller_commission,
            currency=item.commission_currency,
        ),
        line_amount=Money(
            amount=line_amount,
            currency=item.commission_currency,
        ),
    )


async def load_components_by_commission(
    session: AsyncSession,
    commissions: list[Commission],
) -> dict[UUID, list[CommissionComponentPublic]]:
    if not commissions:
        return {}

    commission_ids = [commission.id for commission in commissions]
    by_commission: dict[UUID, list[CommissionComponentPublic]] = defaultdict(list)

    components_result = await session.execute(
        select(OrderItemCommissionComponent, OrderItem)
        .join(OrderItem, OrderItem.id == OrderItemCommissionComponent.order_item_id)
        .where(col(OrderItemCommissionComponent.commission_id).in_(commission_ids))
        .order_by(OrderItem.created_at, OrderItem.id, OrderItemCommissionComponent.kind)
    )
    for component, item in components_result.all():
        if component.commission_id is None:
            continue
        by_commission[component.commission_id].append(
            _component_to_public(component, item)
        )

    # Legacy items: linked via order_item.commission_id without component rows.
    legacy_result = await session.execute(
        select(OrderItem)
        .where(col(OrderItem.commission_id).in_(commission_ids))
        .order_by(OrderItem.created_at, OrderItem.id)
    )
    for item in legacy_result.scalars().all():
        if item.commission_id is None:
            continue
        # Skip if this item already contributed via components for this commission.
        already = any(
            c.order_item_id == item.id for c in by_commission.get(item.commission_id, [])
        )
        if already:
            continue
        legacy = _legacy_component_from_item(item)
        if legacy is not None:
            by_commission[item.commission_id].append(legacy)

    return dict(by_commission)


async def attach_items_to_commissions(
    session: AsyncSession,
    commissions: list[Commission],
) -> None:
    commission_ids = [commission.id for commission in commissions]
    by_commission = await load_order_item_ids_by_commission(session, commission_ids)
    components_by_commission = await load_components_by_commission(
        session,
        commissions,
    )
    amounts_by_commission = await load_amounts_by_commission(session, commission_ids)
    for commission in commissions:
        attach_order_item_ids(
            commission,
            by_commission.get(commission.id, []),
        )
        attach_components(
            commission,
            components_by_commission.get(commission.id, []),
        )
        attach_amounts(
            commission,
            amounts_by_commission.get(commission.id, []),
        )
