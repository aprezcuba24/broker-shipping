"""convert money columns to integer cents

Revision ID: m3a4b5c6d7e8
Revises: l2f3a4b5c6d7
Create Date: 2026-08-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "m3a4b5c6d7e8"
down_revision: str | Sequence[str] | None = "l2f3a4b5c6d7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_PRODUCT_MONEY_COLS = ("price", "commission")
_ORDER_ITEM_MONEY_COLS = (
    "unit_provider_price",
    "seller_provider_price",
    "customer_change",
    "seller_commission",
)


def upgrade() -> None:
    for col in _PRODUCT_MONEY_COLS:
        op.alter_column(
            "product",
            col,
            existing_type=sa.Numeric(precision=12, scale=2),
            type_=sa.BigInteger(),
            existing_nullable=False,
            server_default="0",
            postgresql_using=f"ROUND({col} * 100)::bigint",
        )

    for col in _ORDER_ITEM_MONEY_COLS:
        kwargs: dict = {
            "existing_type": sa.Numeric(precision=12, scale=2),
            "type_": sa.BigInteger(),
            "existing_nullable": False,
            "postgresql_using": f"ROUND({col} * 100)::bigint",
        }
        if col == "customer_change":
            kwargs["server_default"] = "0"
        op.alter_column("order_item", col, **kwargs)


def downgrade() -> None:
    for col in _ORDER_ITEM_MONEY_COLS:
        kwargs: dict = {
            "existing_type": sa.BigInteger(),
            "type_": sa.Numeric(precision=12, scale=2),
            "existing_nullable": False,
            "postgresql_using": f"({col}::numeric / 100)",
        }
        if col == "customer_change":
            kwargs["server_default"] = "0"
        op.alter_column("order_item", col, **kwargs)

    for col in _PRODUCT_MONEY_COLS:
        op.alter_column(
            "product",
            col,
            existing_type=sa.BigInteger(),
            type_=sa.Numeric(precision=12, scale=2),
            existing_nullable=False,
            server_default="0",
            postgresql_using=f"({col}::numeric / 100)",
        )
