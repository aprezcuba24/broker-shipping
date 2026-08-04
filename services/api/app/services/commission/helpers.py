from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.models.commission.commission import Commission
from app.models.order.order_item import OrderItem


def attach_order_item_ids(commission: Commission, order_item_ids: list[UUID]) -> Commission:
    object.__setattr__(commission, "order_item_ids", order_item_ids)
    return commission


async def load_order_item_ids_by_commission(
    session: AsyncSession,
    commission_ids: list[UUID],
) -> dict[UUID, list[UUID]]:
    if not commission_ids:
        return {}
    result = await session.execute(
        select(OrderItem.id, OrderItem.commission_id)
        .where(col(OrderItem.commission_id).in_(commission_ids))
        .order_by(OrderItem.created_at, OrderItem.id)
    )
    by_commission: dict[UUID, list[UUID]] = defaultdict(list)
    for item_id, commission_id in result.all():
        if commission_id is not None:
            by_commission[commission_id].append(item_id)
    return dict(by_commission)


async def attach_items_to_commissions(
    session: AsyncSession,
    commissions: list[Commission],
) -> None:
    by_commission = await load_order_item_ids_by_commission(
        session,
        [commission.id for commission in commissions],
    )
    for commission in commissions:
        attach_order_item_ids(
            commission,
            by_commission.get(commission.id, []),
        )
