from __future__ import annotations

from transitions import Machine

from app.lib.exceptions import raise_api_error
from app.lib.exceptions.catalog import ORDER_ITEM_STATUS_LABELS
from app.models.order.enums import OrderItemStatus

_STATES = [status.value for status in OrderItemStatus]

_TRANSITIONS = [
    {
        "trigger": "to_reviewed",
        "source": OrderItemStatus.created.value,
        "dest": OrderItemStatus.reviewed.value,
    },
    {
        "trigger": "to_sent",
        "source": OrderItemStatus.reviewed.value,
        "dest": OrderItemStatus.sent.value,
    },
    {
        "trigger": "to_delivered",
        "source": OrderItemStatus.sent.value,
        "dest": OrderItemStatus.delivered.value,
    },
    {
        "trigger": "to_canceled",
        "source": [
            OrderItemStatus.created.value,
            OrderItemStatus.reviewed.value,
            OrderItemStatus.sent.value,
        ],
        "dest": OrderItemStatus.canceled.value,
    },
]

class _OrderItemStatusModel:
    def __init__(self, status: OrderItemStatus) -> None:
        self.state = status.value

def can_transition(current: OrderItemStatus, target: OrderItemStatus) -> bool:
    if current == target:
        return True
    model = _OrderItemStatusModel(current)
    Machine(
        model=model,
        states=_STATES,
        transitions=_TRANSITIONS,
        initial=current.value,
        auto_transitions=False,
    )
    trigger_name = f"to_{target.value}"
    may_trigger = getattr(model, f"may_{trigger_name}", None)
    if may_trigger is None:
        return False
    return bool(may_trigger())

def assert_transition(current: OrderItemStatus, target: OrderItemStatus) -> None:
    if not can_transition(current, target):
        raise_api_error(
            "invalid_status_transition",
            current=current.value,
            target=target.value,
            current_label=ORDER_ITEM_STATUS_LABELS.get(current.value, current.value),
            target_label=ORDER_ITEM_STATUS_LABELS.get(target.value, target.value),
        )
