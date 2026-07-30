from sqlmodel import SQLModel

from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Order, OrderItem)

__all__ = [
    "DOMAIN_MODELS",
    "Currency",
    "Order",
    "OrderItem",
    "OrderItemStatus",
    "OrderStatus",
]
