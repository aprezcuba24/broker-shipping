from uuid import UUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    Enum as SAEnum,
    ForeignKey,
    Index,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.order.enums import Currency, OrderItemStatus


class OrderItem(EntityModel, table=True):
    __tablename__ = "order_item"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_item_quantity_positive"),
        CheckConstraint(
            "seller_provider_price >= unit_provider_price",
            name="ck_order_item_seller_price_gte_provider",
        ),
        CheckConstraint(
            "customer_change >= 0",
            name="ck_order_item_customer_change_non_negative",
        ),
        Index(
            "ix_order_item_provider_organization_id_status",
            "provider_organization_id",
            "status",
        ),
    )

    order_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    product_id: UUID = Field(foreign_key="product.id", index=True)
    provider_organization_id: UUID = Field(foreign_key="organization.id", index=True)
    unit_provider_price: int = Field(
        sa_column=Column(BigInteger, nullable=False),
    )
    seller_provider_price: int = Field(
        sa_column=Column(BigInteger, nullable=False),
    )
    customer_change: int = Field(
        default=0,
        sa_column=Column(BigInteger, nullable=False, server_default="0"),
    )
    quantity: int
    currency: Currency = Field(
        sa_column=Column(
            SAEnum(
                Currency,
                values_callable=lambda x: [e.value for e in x],
                name="currency",
            ),
            nullable=False,
        ),
    )
    status: OrderItemStatus = Field(
        default=OrderItemStatus.created,
        sa_column=Column(
            SAEnum(
                OrderItemStatus,
                values_callable=lambda x: [e.value for e in x],
                name="orderitemstatus",
            ),
            nullable=False,
        ),
    )
    seller_commission: int = Field(
        sa_column=Column(BigInteger, nullable=False),
    )
