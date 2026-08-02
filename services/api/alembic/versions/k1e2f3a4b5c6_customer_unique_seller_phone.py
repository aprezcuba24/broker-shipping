"""customer unique seller phone

Revision ID: k1e2f3a4b5c6
Revises: j0d1e2f3a4b5
Create Date: 2026-07-31

"""

from collections.abc import Sequence

from alembic import op

revision: str = "k1e2f3a4b5c6"
down_revision: str | Sequence[str] | None = "j0d1e2f3a4b5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_customer_seller_phone", table_name="customer")
    op.create_unique_constraint(
        "uq_customer_seller_phone",
        "customer",
        ["seller_organization_id", "phone"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_customer_seller_phone", "customer", type_="unique")
    op.create_index(
        "ix_customer_seller_phone",
        "customer",
        ["seller_organization_id", "phone"],
        unique=False,
    )
