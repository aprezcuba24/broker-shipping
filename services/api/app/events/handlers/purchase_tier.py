from __future__ import annotations

from app.db.context import AppContext
from app.events.types import CustomerUpdated, OrderStatusChangedEvent
from app.lib.events.registry import listener
from app.services.customer import purchase_tier as purchase_tier_service


@listener(OrderStatusChangedEvent)
async def on_order_status_changed(
    event: OrderStatusChangedEvent,
    ctx: AppContext,
) -> None:
    await purchase_tier_service.refresh_purchase_tier_for_order(
        ctx.session,
        event.order_id,
    )


@listener(CustomerUpdated)
async def on_customer_updated(
    event: CustomerUpdated,
    ctx: AppContext,
) -> None:
    previous = event.previous
    if previous is not None and previous.phone == event.new.phone:
        return
    if previous is not None:
        await purchase_tier_service.refresh_purchase_tier_for_phone(
            ctx.session,
            previous.phone,
        )
    await purchase_tier_service.refresh_purchase_tier_for_phone(
        ctx.session,
        event.new.phone,
    )
