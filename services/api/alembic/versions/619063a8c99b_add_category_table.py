"""add category table

Revision ID: 619063a8c99b
Revises: b7e4d1c9028f
Create Date: 2026-05-23

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "619063a8c99b"
down_revision: str | Sequence[str] | None = "b7e4d1c9028f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "category",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_category_organization_id"), "category", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_category_organization_id"), table_name="category")
    op.drop_table("category")
