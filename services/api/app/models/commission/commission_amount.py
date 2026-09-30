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


class CommissionAmount(EntityModel, table=True):
    """Per-currency total for a commission (one row per currency)."""

    __tablename__ = "commission_amount"
    __table_args__ = (
        UniqueConstraint(
            "commission_id",
            "currency",
            name="uq_commission_amount_commission_currency",
        ),
    )

    commission_id: UUID = Field(
        sa_column=Column(
            ForeignKey("commission.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
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
