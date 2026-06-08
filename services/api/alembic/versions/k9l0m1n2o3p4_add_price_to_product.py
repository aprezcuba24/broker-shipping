"""add price to product

Revision ID: k9l0m1n2o3p4
Revises: j8k9l0m1n2o3
Create Date: 2026-06-02

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "k9l0m1n2o3p4"
down_revision: str | Sequence[str] | None = "j8k9l0m1n2o3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("price", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("product", "price")
