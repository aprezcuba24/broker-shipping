"""add tag and product_tag tables

Revision ID: i9c0d1e2f3a4
Revises: h8b9c0d1e2f3
Create Date: 2026-07-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "i9c0d1e2f3a4"
down_revision: str | Sequence[str] | None = "h8b9c0d1e2f3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tag",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            name=op.f("fk_tag_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "name",
            name="uq_tag_organization_id_name",
        ),
    )
    op.create_index(op.f("ix_tag_name"), "tag", ["name"], unique=False)
    op.create_index(
        op.f("ix_tag_organization_id"),
        "tag",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "product_tag",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["product.id"],
            name=op.f("fk_product_tag_product_id_product"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tag.id"],
            name=op.f("fk_product_tag_tag_id_tag"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("product_id", "tag_id"),
    )


def downgrade() -> None:
    op.drop_table("product_tag")
    op.drop_index(op.f("ix_tag_organization_id"), table_name="tag")
    op.drop_index(op.f("ix_tag_name"), table_name="tag")
    op.drop_table("tag")
