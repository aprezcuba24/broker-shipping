"""Add customer purchase_tier and phone index.

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-09-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e0f1a2b3c4d5"
down_revision: str | Sequence[str] | None = "d9e0f1a2b3c4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "customer",
        sa.Column(
            "purchase_tier",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.create_index(
        op.f("ix_customer_phone"),
        "customer",
        ["phone"],
        unique=False,
    )
    op.execute(
        """
        WITH finished_counts AS (
            SELECT c.phone AS phone, COUNT(o.id) AS finished_count
            FROM customer c
            JOIN "order" o ON o.customer_id = c.id
            WHERE o.status = 'finished'
            GROUP BY c.phone
        )
        UPDATE customer
        SET purchase_tier = CASE
            WHEN finished_counts.finished_count <= 0 THEN 0
            WHEN finished_counts.finished_count < 5 THEN 1
            WHEN finished_counts.finished_count < 10 THEN 5
            ELSE 10
        END
        FROM finished_counts
        WHERE customer.phone = finished_counts.phone
        """
    )
    op.alter_column("customer", "purchase_tier", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_customer_phone"), table_name="customer")
    op.drop_column("customer", "purchase_tier")
