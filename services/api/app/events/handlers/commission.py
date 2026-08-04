from __future__ import annotations

from app.db.context import AppContext
from app.events.types import OrderItemDeliveredEvent
from app.lib.events.registry import listener
from app.services.commission import assign as assign_service


@listener(OrderItemDeliveredEvent)
async def on_order_item_delivered(
    event: OrderItemDeliveredEvent,
    ctx: AppContext,
) -> None:
    await assign_service.assign_delivered_item(ctx.session, event.order_item_id)
