"""user name and email instead of username

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: str | Sequence[str] | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("name", sa.String(length=255), nullable=False, server_default=""),
    )
    op.alter_column("user", "name", server_default=None)
    op.drop_index(op.f("ix_user_username"), table_name="user")
    op.alter_column(
        "user",
        "username",
        new_column_name="email",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.alter_column(
        "user",
        "email",
        new_column_name="username",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )
    op.create_index(op.f("ix_user_username"), "user", ["username"], unique=True)
    op.drop_column("user", "name")
