"""add orders tables and user phone

Revision ID: ae80ffdd2f54
Revises: 5189ba849f86
Create Date: 2026-06-01 08:14:10.939753

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "ae80ffdd2f54"
down_revision: str | Sequence[str] | None = "5189ba849f86"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "order",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("seller_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["user.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["user.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_customer_id"), "order", ["customer_id"], unique=False)
    op.create_index(op.f("ix_order_seller_id"), "order", ["seller_id"], unique=False)
    op.create_table(
        "order_line",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("product_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["order.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_line_order_id"), "order_line", ["order_id"], unique=False)
    op.create_index(
        op.f("ix_order_line_organization_id"),
        "order_line",
        ["organization_id"],
        unique=False,
    )
    op.create_index(op.f("ix_order_line_product_id"), "order_line", ["product_id"], unique=False)
    op.add_column("user", sa.Column("phone", sa.String(length=32), nullable=True))
    op.create_index(op.f("ix_user_phone"), "user", ["phone"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_phone"), table_name="user")
    op.drop_column("user", "phone")
    op.drop_index(op.f("ix_order_line_product_id"), table_name="order_line")
    op.drop_index(op.f("ix_order_line_organization_id"), table_name="order_line")
    op.drop_index(op.f("ix_order_line_order_id"), table_name="order_line")
    op.drop_table("order_line")
    op.drop_index(op.f("ix_order_seller_id"), table_name="order")
    op.drop_index(op.f("ix_order_customer_id"), table_name="order")
    op.drop_table("order")
