"""Unique user phone and phone_blacklist modus_operandi.

Revision ID: r3s4t5u6v7w8
Revises: q2r3s4t5u6v7
Create Date: 2026-10-02

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "r3s4t5u6v7w8"
down_revision: str | Sequence[str] | None = "q2r3s4t5u6v7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        op.f("ix_user_phone"),
        "user",
        ["phone"],
        unique=True,
    )
    op.add_column(
        "phone_blacklist",
        sa.Column("modus_operandi", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("phone_blacklist", "modus_operandi")
    op.drop_index(op.f("ix_user_phone"), table_name="user")
