from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    text,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.order.enums import Currency


class Commission(EntityModel, table=True):
    __tablename__ = "commission"
    __table_args__ = (
        Index(
            "ix_commission_provider_organization_id_is_paid",
            "provider_organization_id",
            "is_paid",
        ),
        Index(
            "uq_commission_unpaid_order_provider_currency",
            "order_id",
            "provider_organization_id",
            "currency",
            unique=True,
            postgresql_where=text("is_paid = false"),
        ),
    )

    order_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    provider_organization_id: UUID = Field(
        foreign_key="organization.id",
        index=True,
    )
    seller_organization_id: UUID = Field(
        foreign_key="organization.id",
        index=True,
    )
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
    is_paid: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default="false"),
    )
    paid_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, nullable=True),
    )
