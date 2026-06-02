from collections.abc import Sequence

from app.modules.orders.models.enums import OrderLineStatus, OrderStatus
from app.modules.orders.models.order_line import OrderLine


def compute_order_status(lines: Sequence[OrderLine]) -> OrderStatus:
    if not lines:
        return OrderStatus.created

    statuses = [line.status for line in lines]

    if all(s == OrderLineStatus.canceled for s in statuses):
        return OrderStatus.canceled
    if all(s == OrderLineStatus.created for s in statuses):
        return OrderStatus.created
    if any(s == OrderLineStatus.delivered for s in statuses) and all(
        s in (OrderLineStatus.delivered, OrderLineStatus.canceled) for s in statuses
    ):
        return OrderStatus.finished
    return OrderStatus.processing
