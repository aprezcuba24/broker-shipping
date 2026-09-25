"""Normalize customer phone to canonical 53 + 8 digits.

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-09-22

"""

from collections.abc import Sequence

from alembic import op

revision: str = "d9e0f1a2b3c4"
down_revision: str | Sequence[str] | None = "c8d9e0f1a2b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE customer
        SET phone = CASE
            WHEN left(phone, 1) = '+' THEN substr(phone, 2)
            ELSE phone
        END
        """
    )
    op.execute(
        """
        UPDATE customer
        SET phone = '53' || phone
        WHERE length(phone) = 8
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE customer
        SET phone = substr(phone, 3)
        WHERE length(phone) = 10 AND left(phone, 2) = '53'
        """
    )
