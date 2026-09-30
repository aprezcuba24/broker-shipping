"""Add description and has_commission to product.

Revision ID: j5k6l7m8n9o0
Revises: i4j5k6l7m8n9
Create Date: 2026-09-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "j5k6l7m8n9o0"
down_revision: str | Sequence[str] | None = "i4j5k6l7m8n9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("description", sa.String(length=2000), nullable=True),
    )
    op.add_column(
        "product",
        sa.Column(
            "has_commission",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.execute(
        sa.text(
            "UPDATE product SET has_commission = (commission > 0)"
        )
    )


def downgrade() -> None:
    op.drop_column("product", "has_commission")
    op.drop_column("product", "description")
