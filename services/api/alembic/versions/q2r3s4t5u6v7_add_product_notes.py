"""Add notes to product (provider-only).

Revision ID: q2r3s4t5u6v7
Revises: p1q2r3s4t5u6
Create Date: 2026-10-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "q2r3s4t5u6v7"
down_revision: str | Sequence[str] | None = "p1q2r3s4t5u6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("notes", sa.String(length=2000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("product", "notes")
