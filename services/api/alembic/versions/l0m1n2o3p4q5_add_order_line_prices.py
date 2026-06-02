"""add order line product_price and price

Revision ID: l0m1n2o3p4q5
Revises: k9l0m1n2o3p4
Create Date: 2026-06-02

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "l0m1n2o3p4q5"
down_revision: str | Sequence[str] | None = "k9l0m1n2o3p4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "order_line",
        sa.Column("product_price", sa.Integer(), nullable=False),
    )
    op.add_column(
        "order_line",
        sa.Column("price", sa.Integer(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("order_line", "price")
    op.drop_column("order_line", "product_price")
