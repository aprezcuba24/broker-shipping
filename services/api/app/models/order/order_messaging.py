from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Column,
    Enum as SAEnum,
    ForeignKey,
    UniqueConstraint,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.order.enums import Currency


class OrderMessaging(EntityModel, table=True):
    __tablename__ = "order_messaging"
    __table_args__ = (
        UniqueConstraint(
            "order_id",
            "provider_organization_id",
            name="uq_order_messaging_order_provider",
        ),
    )

    order_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    provider_organization_id: UUID = Field(foreign_key="organization.id", index=True)
    provider_organization_name: str = Field(default="", max_length=255)
    neighborhood_id: UUID = Field(foreign_key="neighborhood.id", index=True)
    neighborhood_name: str = Field(default="", max_length=255)
    amount: int = Field(
        sa_column=Column(BigInteger, nullable=False),
    )
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
