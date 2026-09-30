from types import SimpleNamespace

from app.models.order.enums import OrderItemStatus, OrderStatus
from app.services.order.helpers import derive_order_status
from app.services.order.item_status import can_transition


def test_can_transition_rules() -> None:
    assert can_transition(OrderItemStatus.created, OrderItemStatus.reviewed)
    assert can_transition(OrderItemStatus.reviewed, OrderItemStatus.sent)
    assert can_transition(OrderItemStatus.sent, OrderItemStatus.delivered)
    assert can_transition(OrderItemStatus.created, OrderItemStatus.canceled)
    assert can_transition(OrderItemStatus.reviewed, OrderItemStatus.canceled)
    assert can_transition(OrderItemStatus.sent, OrderItemStatus.canceled)
    assert can_transition(OrderItemStatus.created, OrderItemStatus.created)
    assert not can_transition(OrderItemStatus.created, OrderItemStatus.sent)
    assert not can_transition(OrderItemStatus.delivered, OrderItemStatus.reviewed)
    assert not can_transition(OrderItemStatus.canceled, OrderItemStatus.created)
    assert not can_transition(OrderItemStatus.delivered, OrderItemStatus.canceled)


def test_derive_order_status() -> None:
    def items(*statuses: OrderItemStatus) -> list:
        return [SimpleNamespace(status=status) for status in statuses]

    assert derive_order_status(items(OrderItemStatus.created)) == OrderStatus.created
    assert (
        derive_order_status(
            items(OrderItemStatus.created, OrderItemStatus.reviewed)
        )
        == OrderStatus.processing
    )
    assert (
        derive_order_status(items(OrderItemStatus.sent, OrderItemStatus.created))
        == OrderStatus.processing
    )
    assert (
        derive_order_status(
            items(OrderItemStatus.delivered, OrderItemStatus.canceled)
        )
        == OrderStatus.finished
    )
    assert (
        derive_order_status(
            items(OrderItemStatus.canceled, OrderItemStatus.canceled)
        )
        == OrderStatus.canceled
    )
