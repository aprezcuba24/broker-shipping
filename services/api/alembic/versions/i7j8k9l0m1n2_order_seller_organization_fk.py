"""order seller references seller organization

Revision ID: i7j8k9l0m1n2
Revises: h5i6j7k8l9m0
Create Date: 2026-06-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "i7j8k9l0m1n2"
down_revision: str | Sequence[str] | None = "h5i6j7k8l9m0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SELLER_FK = "order_seller_id_fkey"
SELLER_INDEX = "ix_order_seller_id"


def upgrade() -> None:
    op.drop_constraint(SELLER_FK, "order", type_="foreignkey")

    op.execute(
        """
        UPDATE "order" AS o
        SET seller_id = sub.organization_id
        FROM (
            SELECT uo.user_id, uo.organization_id
            FROM user_organization uo
            INNER JOIN organization org ON org.id = uo.organization_id
            WHERE org.type = 'seller'
              AND org.deleted_at IS NULL
        ) AS sub
        WHERE o.seller_id = sub.user_id
        """
    )

    op.alter_column("order", "seller_id", new_column_name="seller_organization_id")
    op.drop_index(SELLER_INDEX, table_name="order")
    op.create_index(
        op.f("ix_order_seller_organization_id"),
        "order",
        ["seller_organization_id"],
        unique=False,
    )
    op.create_foreign_key(
        SELLER_FK,
        "order",
        "organization",
        ["seller_organization_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(SELLER_FK, "order", type_="foreignkey")
    op.drop_index(op.f("ix_order_seller_organization_id"), table_name="order")
    op.create_index(SELLER_INDEX, "order", ["seller_organization_id"], unique=False)
    op.alter_column("order", "seller_organization_id", new_column_name="seller_id")

    op.execute(
        """
        UPDATE "order" AS o
        SET seller_id = sub.user_id
        FROM (
            SELECT uo.user_id, uo.organization_id
            FROM user_organization uo
            INNER JOIN organization org ON org.id = uo.organization_id
            WHERE org.type = 'seller'
              AND org.deleted_at IS NULL
        ) AS sub
        WHERE o.seller_id = sub.organization_id
        """
    )

    op.create_foreign_key(
        SELLER_FK,
        "order",
        "user",
        ["seller_id"],
        ["id"],
        ondelete="RESTRICT",
    )
