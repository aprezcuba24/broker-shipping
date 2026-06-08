from typing import Any
from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from app.lib.persistence import OrganizationEntityModel
from app.modules.orders.models.enums import OrderLineStatus


class OrderLine(OrganizationEntityModel, table=True):
    __tablename__ = "order_line"

    order_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    product_id: UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("product.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
    )
    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    quantity: int = Field(gt=0)
    product_price: int = Field(ge=0, description="Unit catalog price in cents at line creation")
    price: int = Field(ge=0, description="Unit charged price in cents (client-provided)")
    status: OrderLineStatus = Field(
        default=OrderLineStatus.created,
        sa_column=Column(
            SAEnum(OrderLineStatus, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    product_snapshot: dict[str, Any] = Field(
        sa_column=Column(JSONB, nullable=False),
        description=(
            "Product data at purchase time, e.g. name, category_id, organization_id, price."
        ),
    )
