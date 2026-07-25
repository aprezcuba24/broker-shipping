"""add multi-tenant core tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

organizationtype = sa.Enum(
    "provider",
    "seller",
    name="organizationtype",
)


def upgrade() -> None:
    organizationtype.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "user",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_username"), "user", ["username"], unique=True)

    op.create_table(
        "organization",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", organizationtype, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_organization",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", "organization_id"),
    )

    op.create_table(
        "provider_seller_link",
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("linked_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["provider_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "provider_organization_id",
            "seller_organization_id",
        ),
    )

    op.add_column("product", sa.Column("organization_id", sa.Uuid(), nullable=False))
    op.create_index(
        op.f("ix_product_organization_id"),
        "product",
        ["organization_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("fk_product_organization_id_organization"),
        "product",
        "organization",
        ["organization_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_product_organization_id_organization"),
        "product",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_product_organization_id"), table_name="product")
    op.drop_column("product", "organization_id")

    op.drop_table("provider_seller_link")
    op.drop_table("user_organization")
    op.drop_table("organization")
    op.drop_index(op.f("ix_user_username"), table_name="user")
    op.drop_table("user")

    organizationtype.drop(op.get_bind(), checkfirst=True)
