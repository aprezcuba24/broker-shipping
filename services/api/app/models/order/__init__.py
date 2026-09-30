from sqlmodel import SQLModel

from app.models.order.commission_component import (
    CommissionComponentKind,
    OrderItemCommissionComponent,
)
from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.order.order_messaging import OrderMessaging

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (
    Order,
    OrderItem,
    OrderMessaging,
    OrderItemCommissionComponent,
)

__all__ = [
    "DOMAIN_MODELS",
    "CommissionComponentKind",
    "Currency",
    "Order",
    "OrderItem",
    "OrderItemCommissionComponent",
    "OrderItemStatus",
    "OrderMessaging",
    "OrderStatus",
]
