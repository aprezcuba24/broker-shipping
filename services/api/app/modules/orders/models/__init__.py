from sqlmodel import SQLModel

from app.modules.orders.models.enums import OrderLineStatus, OrderStatus
from app.modules.orders.models.address import Address
from app.modules.orders.models.customer import Customer
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine

MODULE_MODELS: tuple[type[SQLModel], ...] = (
    Customer,
    Address,
    Order,
    OrderLine,
)

__all__ = [
    "MODULE_MODELS",
    "Address",
    "Customer",
    "Order",
    "OrderLine",
    "OrderLineStatus",
    "OrderStatus",
]
