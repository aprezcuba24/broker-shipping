"""add order line status and quantity

Revision ID: j8k9l0m1n2o3
Revises: i7j8k9l0m1n2
Create Date: 2026-06-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "j8k9l0m1n2o3"
down_revision: str | Sequence[str] | None = "i7j8k9l0m1n2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

orderlinestatus = postgresql.ENUM(
    "created",
    "accepted",
    "processed",
    "shipped",
    "delivered",
    "canceled",
    name="orderlinestatus",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM(
        "created",
        "accepted",
        "processed",
        "shipped",
        "delivered",
        "canceled",
        name="orderlinestatus",
    ).create(bind, checkfirst=True)

    op.add_column(
        "order_line",
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
    )
    op.alter_column("order_line", "quantity", server_default=None)

    op.add_column(
        "order_line",
        sa.Column(
            "status",
            orderlinestatus,
            nullable=False,
            server_default="created",
        ),
    )
    op.alter_column("order_line", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("order_line", "status")
    op.drop_column("order_line", "quantity")
    bind = op.get_bind()
    postgresql.ENUM(name="orderlinestatus").drop(bind, checkfirst=True)
