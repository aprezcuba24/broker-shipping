"""add updated_at to product and organization

Revision ID: f7b0fc1bc902
Revises: 619063a8c99b
Create Date: 2026-05-23

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f7b0fc1bc902"
down_revision: str | Sequence[str] | None = "619063a8c99b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("organization", sa.Column("updated_at", sa.DateTime(), nullable=True))
    op.add_column("product", sa.Column("updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("product", "updated_at")
    op.drop_column("organization", "updated_at")
