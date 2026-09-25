from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.order.enums import OrderStatus


class Order(EntityModel, table=True):
    __tablename__ = "order"
    __table_args__ = (
        UniqueConstraint(
            "seller_organization_id",
            "code",
            name="uq_order_seller_code",
        ),
    )

    code: str = Field(max_length=20, index=True)
    seller_organization_id: UUID = Field(foreign_key="organization.id", index=True)
    seller_organization_name: str = Field(default="", max_length=255)
    customer_id: UUID = Field(foreign_key="customer.id", index=True)
    customer_name: str = Field(default="", max_length=255)
    customer_ci: str = Field(default="", max_length=50)
    customer_phone: str = Field(default="", max_length=50)
    customer_address: str = Field(default="", max_length=500)
    customer_province_name: str = Field(default="", max_length=255)
    customer_municipality_name: str = Field(default="", max_length=255)
    status: OrderStatus = Field(
        default=OrderStatus.created,
        sa_column=Column(
            SAEnum(
                OrderStatus,
                values_callable=lambda x: [e.value for e in x],
                name="orderstatus",
            ),
            nullable=False,
        ),
    )
