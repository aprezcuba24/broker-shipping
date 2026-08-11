"""add product image_key

Revision ID: o5c6d7e8f9a0
Revises: n4b5c6d7e8f9
Create Date: 2026-08-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "o5c6d7e8f9a0"
down_revision: str | Sequence[str] | None = "n4b5c6d7e8f9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("image_key", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("product", "image_key")
