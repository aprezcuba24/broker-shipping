"""add user phone

Revision ID: n9o0p1q2r3s4
Revises: m8n9o0p1q2r3
Create Date: 2026-09-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "n9o0p1q2r3s4"
down_revision: str | Sequence[str] | None = "m8n9o0p1q2r3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("phone", sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user", "phone")
