"""add organization_id to product

Revision ID: a1b2c3d4e5f6
Revises: 619063a8c99b
Create Date: 2026-05-23

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "619063a8c99b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("product", sa.Column("organization_id", sa.Uuid(), nullable=False))
    op.create_foreign_key(
        "fk_product_organization_id_organization",
        "product",
        "organization",
        ["organization_id"],
        ["id"],
    )
    op.create_index(op.f("ix_product_organization_id"), "product", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_product_organization_id"), table_name="product")
    op.drop_constraint("fk_product_organization_id_organization", "product", type_="foreignkey")
    op.drop_column("product", "organization_id")
