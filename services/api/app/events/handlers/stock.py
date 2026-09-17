from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select

from app.db.context import AppContext
from app.events.types import (
    OrderCreatedEvent,
    OrderItemCanceledEvent,
    OrderItemConsumedEvent,
)
from app.lib.events.registry import listener
from app.models.order.order_item import OrderItem
from app.services import stock as stock_service


@listener(OrderCreatedEvent)
async def on_order_created(
    event: OrderCreatedEvent,
    ctx: AppContext,
) -> None:
    result = await ctx.session.execute(
        select(OrderItem).where(OrderItem.order_id == event.order_id)
    )
    items = list(result.scalars().all())
    if not items:
        raise HTTPException(status_code=404, detail="Not found")
    quantities = {item.product_id: item.quantity for item in items}
    await stock_service.reserve_products_stock(ctx.session, quantities)


@listener(OrderItemCanceledEvent)
async def on_order_item_canceled(
    event: OrderItemCanceledEvent,
    ctx: AppContext,
) -> None:
    item = await ctx.session.get(OrderItem, event.order_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Not found")
    await stock_service.release_products_stock(
        ctx.session,
        {item.product_id: item.quantity},
    )


@listener(OrderItemConsumedEvent)
async def on_order_item_consumed(
    event: OrderItemConsumedEvent,
    ctx: AppContext,
) -> None:
    item = await ctx.session.get(OrderItem, event.order_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Not found")
    await stock_service.consume_products_stock(
        ctx.session,
        {item.product_id: item.quantity},
    )
