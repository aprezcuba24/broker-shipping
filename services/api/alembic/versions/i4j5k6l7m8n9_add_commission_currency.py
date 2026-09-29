"""Add commission_currency to product and order_item.

Revision ID: i4j5k6l7m8n9
Revises: h3i4j5k6l7m8
Create Date: 2026-09-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "i4j5k6l7m8n9"
down_revision: str | Sequence[str] | None = "h3i4j5k6l7m8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_currency = postgresql.ENUM("cup", "usd", name="currency", create_type=False)


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column(
            "commission_currency",
            _currency,
            nullable=False,
            server_default="cup",
        ),
    )
    op.execute(
        sa.text("UPDATE product SET commission_currency = currency")
    )

    op.add_column(
        "order_item",
        sa.Column(
            "commission_currency",
            _currency,
            nullable=False,
            server_default="cup",
        ),
    )
    op.execute(
        sa.text("UPDATE order_item SET commission_currency = currency")
    )


def downgrade() -> None:
    op.drop_column("order_item", "commission_currency")
    op.drop_column("product", "commission_currency")
