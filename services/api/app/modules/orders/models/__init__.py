from sqlmodel import SQLModel

from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine

MODULE_MODELS: tuple[type[SQLModel], ...] = (Order, OrderLine)

__all__ = [
    "MODULE_MODELS",
    "Order",
    "OrderLine",
]
