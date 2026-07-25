"""rename order_invoice_sequence to seller_organization_data

Revision ID: o3p4q5r6s7t8
Revises: n2o3p4q5r6s7
Create Date: 2026-06-10

"""

from collections.abc import Sequence

from alembic import op

revision: str = "o3p4q5r6s7t8"
down_revision: str | Sequence[str] | None = "n2o3p4q5r6s7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.rename_table("order_invoice_sequence", "seller_organization_data")
    op.alter_column(
        "seller_organization_data",
        "last_number",
        new_column_name="last_invoice_number",
    )


def downgrade() -> None:
    op.alter_column(
        "seller_organization_data",
        "last_invoice_number",
        new_column_name="last_number",
    )
    op.rename_table("seller_organization_data", "order_invoice_sequence")
