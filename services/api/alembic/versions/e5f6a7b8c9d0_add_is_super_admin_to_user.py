"""add is_super_admin to user

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: str | Sequence[str] | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "is_super_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.create_index(
        op.f("ix_user_is_super_admin"),
        "user",
        ["is_super_admin"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_is_super_admin"), table_name="user")
    op.drop_column("user", "is_super_admin")
