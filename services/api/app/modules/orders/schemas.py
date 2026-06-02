from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel

from app.modules.orders.models.enums import OrderStatus
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine
from app.modules.orders.order_status import compute_order_status
from app.modules.orders.order_totals import compute_order_price, compute_order_product_price


class OrderLineCreate(SQLModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    price: int = Field(ge=0, description="Unit price in cents")


class OrderCreate(SQLModel):
    name: str = Field(max_length=255)
    customer_phone: str = Field(min_length=1, max_length=32)
    lines: list[OrderLineCreate] = Field(min_length=1)


class OrderDetail(SQLModel):
    id: UUID
    name: str
    seller_organization_id: UUID
    customer_id: UUID
    created_at: datetime
    updated_at: datetime | None
    status: OrderStatus
    product_price: int
    price: int
    lines: list[OrderLine]


def build_order_detail(order: Order, lines: list[OrderLine]) -> OrderDetail:
    return OrderDetail(
        id=order.id,
        name=order.name,
        seller_organization_id=order.seller_organization_id,
        customer_id=order.customer_id,
        created_at=order.created_at,
        updated_at=order.updated_at,
        status=compute_order_status(lines),
        product_price=compute_order_product_price(lines),
        price=compute_order_price(lines),
        lines=list(lines),
    )
