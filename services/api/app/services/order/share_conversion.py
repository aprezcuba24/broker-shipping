from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.utils import utc_now
from app.models.order.enums import OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.order.share_conversion import OrderShareConversion
from app.models.product.enums import ShareChannel
from app.schemas.dashboard import ShareChannelConversionPublic


async def create_share_conversions_for_order(
    session: AsyncSession,
    *,
    order_id: UUID,
    seller_organization_id: UUID,
    items: list[OrderItem],
) -> list[OrderShareConversion]:
    channels = {
        item.share_channel
        for item in items
        if item.share_channel is not None
    }
    if not channels:
        return []

    rows = [
        OrderShareConversion(
            order_id=order_id,
            seller_organization_id=seller_organization_id,
            share_channel=channel,
        )
        for channel in sorted(channels, key=lambda c: c.value)
    ]
    session.add_all(rows)
    await session.flush()
    return rows


async def sync_share_conversions_for_order(
    session: AsyncSession,
    order_id: UUID,
) -> None:
    order = await session.get(Order, order_id)
    if order is None:
        return

    result = await session.execute(
        select(OrderShareConversion).where(
            OrderShareConversion.order_id == order_id
        )
    )
    conversions = list(result.scalars().all())
    if not conversions:
        return

    items_result = await session.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = list(items_result.scalars().all())

    now = utc_now()
    if order.status != OrderStatus.finished:
        for conversion in conversions:
            if conversion.finished_at is not None:
                conversion.finished_at = None
                conversion.updated_at = now
        return

    delivered_channels = {
        item.share_channel
        for item in items
        if item.share_channel is not None
        and item.status == OrderItemStatus.delivered
    }
    for conversion in conversions:
        should_finish = conversion.share_channel in delivered_channels
        if should_finish and conversion.finished_at is None:
            conversion.finished_at = now
            conversion.updated_at = now
        elif not should_finish and conversion.finished_at is not None:
            conversion.finished_at = None
            conversion.updated_at = now


async def summarize_share_conversions_for_seller(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    period_start: datetime | None,
) -> list[ShareChannelConversionPublic]:
    arrived = func.count().label("orders_arrived")
    finished = func.count(
        case(
            (col(OrderShareConversion.finished_at).is_not(None), 1),
        )
    ).label("orders_finished")

    stmt = (
        select(
            OrderShareConversion.share_channel,
            arrived,
            finished,
        )
        .where(
            OrderShareConversion.seller_organization_id == seller_organization_id
        )
        .group_by(OrderShareConversion.share_channel)
        .order_by(arrived.desc(), OrderShareConversion.share_channel.asc())
    )
    if period_start is not None:
        stmt = stmt.where(OrderShareConversion.created_at >= period_start)

    result = await session.execute(stmt)
    rows: list[ShareChannelConversionPublic] = []
    for channel, orders_arrived, orders_finished in result.all():
        arrived_count = int(orders_arrived or 0)
        finished_count = int(orders_finished or 0)
        if arrived_count <= 0:
            continue
        rate = finished_count / arrived_count
        rows.append(
            ShareChannelConversionPublic(
                channel=ShareChannel(channel),
                orders_arrived=arrived_count,
                orders_finished=finished_count,
                conversion_rate=rate,
            )
        )
    return rows
