from __future__ import annotations

from app.db.context import AppContext
from app.events.types import OrderStatusChangedEvent
from app.lib.events.registry import listener
from app.services.order import share_conversion as share_conversion_service


@listener(OrderStatusChangedEvent)
async def on_order_status_changed_share_conversion(
    event: OrderStatusChangedEvent,
    ctx: AppContext,
) -> None:
    await share_conversion_service.sync_share_conversions_for_order(
        ctx.session,
        event.order_id,
    )
