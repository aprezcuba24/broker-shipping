from datetime import datetime
from typing import Any
from uuid import UUID

from sqlmodel import Field, SQLModel

from app.modules.orders.models.enums import OrderLineStatus, OrderStatus
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine
from app.modules.orders.order_status import compute_order_status
from app.modules.orders.order_totals import compute_order_price, compute_order_product_price
from app.modules.organization.models import Organization


class OrderLineCreate(SQLModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    price: int = Field(ge=0, description="Unit price in cents")


class OrderCreate(SQLModel):
    name: str = Field(max_length=255)
    customer_phone: str = Field(min_length=1, max_length=32)
    lines: list[OrderLineCreate] = Field(min_length=1)


class OrganizationRef(SQLModel):
    id: UUID
    name: str


class OrderLineDetail(SQLModel):
    id: UUID
    created_at: datetime
    updated_at: datetime | None
    order_id: UUID
    product_id: UUID | None
    organization_id: UUID
    organization: OrganizationRef
    quantity: int
    product_price: int
    price: int
    status: OrderLineStatus
    product_snapshot: dict[str, Any]


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
    lines: list[OrderLineDetail]


def build_order_line_detail(
    line: OrderLine,
    org: Organization | None,
) -> OrderLineDetail:
    return OrderLineDetail(
        id=line.id,
        created_at=line.created_at,
        updated_at=line.updated_at,
        order_id=line.order_id,
        product_id=line.product_id,
        organization_id=line.organization_id,
        organization=OrganizationRef(
            id=line.organization_id,
            name=org.name if org is not None else "",
        ),
        quantity=line.quantity,
        product_price=line.product_price,
        price=line.price,
        status=line.status,
        product_snapshot=line.product_snapshot,
    )


def build_order_detail(
    order: Order,
    lines: list[OrderLine],
    orgs_by_id: dict[UUID, Organization],
) -> OrderDetail:
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
        lines=[
            build_order_line_detail(line, orgs_by_id.get(line.organization_id))
            for line in lines
        ],
    )
