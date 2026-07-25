"""add order invoice sequence and seller-scoped unique name

Revision ID: n2o3p4q5r6s7
Revises: m1n2o3p4q5r6
Create Date: 2026-06-10

"""

from collections import defaultdict
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "n2o3p4q5r6s7"
down_revision: str | Sequence[str] | None = "m1n2o3p4q5r6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _format_invoice_code(sequence_number: int) -> str:
    return f"F{sequence_number:05d}"


def upgrade() -> None:
    op.create_table(
        "order_invoice_sequence",
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("last_number", sa.BigInteger(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("seller_organization_id"),
    )

    connection = op.get_bind()
    orders = connection.execute(
        sa.text(
            """
            SELECT id, seller_organization_id, created_at
            FROM "order"
            ORDER BY seller_organization_id, created_at, id
            """,
        ),
    ).fetchall()

    by_seller: dict = defaultdict(list)
    for row in orders:
        by_seller[row.seller_organization_id].append(row)

    max_by_seller: dict = {}
    for seller_id, seller_orders in by_seller.items():
        for index, order_row in enumerate(seller_orders, start=1):
            code = _format_invoice_code(index)
            connection.execute(
                sa.text('UPDATE "order" SET name = :name WHERE id = :id'),
                {"name": code, "id": order_row.id},
            )
        max_by_seller[seller_id] = len(seller_orders)

    for seller_id, last_number in max_by_seller.items():
        connection.execute(
            sa.text(
                """
                INSERT INTO order_invoice_sequence (seller_organization_id, last_number)
                VALUES (:seller_id, :last_number)
                """,
            ),
            {"seller_id": seller_id, "last_number": last_number},
        )

    op.create_unique_constraint(
        "uq_order_seller_organization_name",
        "order",
        ["seller_organization_id", "name"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_order_seller_organization_name", "order", type_="unique")
    op.drop_table("order_invoice_sequence")
