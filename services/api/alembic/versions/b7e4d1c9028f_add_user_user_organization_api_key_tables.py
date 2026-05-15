"""add user user_organization api_key tables

Revision ID: b7e4d1c9028f
Revises: f8a3c2b1012a
Create Date: 2026-05-14

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7e4d1c9028f"
down_revision: str | Sequence[str] | None = "f8a3c2b1012a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_user_username"), "user", ["username"], unique=False)

    op.create_table(
        "user_organization",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("user_id", "organization_id"),
    )

    op.create_table(
        "api_key",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("prefix", sa.String(length=12), nullable=False),
        sa.Column("secret_hash", sa.String(length=64), nullable=False),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("prefix"),
    )
    op.create_index(op.f("ix_api_key_organization_id"), "api_key", ["organization_id"], unique=False)
    op.create_index(op.f("ix_api_key_prefix"), "api_key", ["prefix"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_api_key_prefix"), table_name="api_key")
    op.drop_index(op.f("ix_api_key_organization_id"), table_name="api_key")
    op.drop_table("api_key")
    op.drop_table("user_organization")
    op.drop_index(op.f("ix_user_username"), table_name="user")
    op.drop_table("user")
