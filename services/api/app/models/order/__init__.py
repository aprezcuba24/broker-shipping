from sqlmodel import SQLModel

from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.order.order_messaging import OrderMessaging

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Order, OrderItem, OrderMessaging)

__all__ = [
    "DOMAIN_MODELS",
    "Currency",
    "Order",
    "OrderItem",
    "OrderItemStatus",
    "OrderMessaging",
    "OrderStatus",
]
