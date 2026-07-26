"""add email verification fields to user

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-07-26

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: str | Sequence[str] | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("email_verified_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "user",
        sa.Column(
            "email_verification_token_hash",
            sa.String(length=64),
            nullable=True,
        ),
    )
    op.add_column(
        "user",
        sa.Column("email_verification_expires_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user", "email_verification_expires_at")
    op.drop_column("user", "email_verification_token_hash")
    op.drop_column("user", "email_verified_at")
