from enum import StrEnum
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    Enum as SAEnum,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.order.enums import Currency


class CommissionComponentKind(StrEnum):
    provider_commission = "provider_commission"
    price_markup = "price_markup"


class OrderItemCommissionComponent(EntityModel, table=True):
    """Immutable per-line commission breakdown written when the order is created."""

    __tablename__ = "order_item_commission_component"
    __table_args__ = (
        CheckConstraint(
            "unit_amount > 0",
            name="ck_order_item_commission_component_unit_amount_positive",
        ),
        UniqueConstraint(
            "order_item_id",
            "kind",
            name="uq_order_item_commission_component_item_kind",
        ),
        Index(
            "ix_order_item_commission_component_commission_id",
            "commission_id",
        ),
    )

    order_item_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order_item.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    kind: CommissionComponentKind = Field(
        sa_column=Column(
            SAEnum(
                CommissionComponentKind,
                values_callable=lambda x: [e.value for e in x],
                name="commissioncomponentkind",
            ),
            nullable=False,
        ),
    )
    unit_amount: int = Field(
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
    commission_id: UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("commission.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
