"""Add seller_product overlay and order_item_commission_component.

Revision ID: l7m8n9o0p1q2
Revises: k6l7m8n9o0p1
Create Date: 2026-09-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "l7m8n9o0p1q2"
down_revision: str | Sequence[str] | None = "k6l7m8n9o0p1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_currency = postgresql.ENUM("cup", "usd", name="currency", create_type=False)
_commission_kind = postgresql.ENUM(
    "provider_commission",
    "price_markup",
    name="commissioncomponentkind",
    create_type=False,
)


def upgrade() -> None:
    _commission_kind.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "seller_product",
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("sale_price", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "sale_price IS NULL OR sale_price >= 0",
            name="ck_seller_product_sale_price_non_negative",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["product.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("seller_organization_id", "product_id"),
    )
    op.create_index(
        op.f("ix_seller_product_product_id"),
        "seller_product",
        ["product_id"],
        unique=False,
    )

    op.create_table(
        "order_item_commission_component",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_item_id", sa.Uuid(), nullable=False),
        sa.Column("kind", _commission_kind, nullable=False),
        sa.Column("unit_amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", _currency, nullable=False),
        sa.Column("commission_id", sa.Uuid(), nullable=True),
        sa.CheckConstraint(
            "unit_amount > 0",
            name="ck_order_item_commission_component_unit_amount_positive",
        ),
        sa.ForeignKeyConstraint(
            ["commission_id"],
            ["commission.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["order_item_id"],
            ["order_item.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "order_item_id",
            "kind",
            name="uq_order_item_commission_component_item_kind",
        ),
    )
    op.create_index(
        op.f("ix_order_item_commission_component_order_item_id"),
        "order_item_commission_component",
        ["order_item_id"],
        unique=False,
    )
    op.create_index(
        "ix_order_item_commission_component_commission_id",
        "order_item_commission_component",
        ["commission_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_order_item_commission_component_commission_id",
        table_name="order_item_commission_component",
    )
    op.drop_index(
        op.f("ix_order_item_commission_component_order_item_id"),
        table_name="order_item_commission_component",
    )
    op.drop_table("order_item_commission_component")
    op.execute("DROP TYPE IF EXISTS commissioncomponentkind")

    op.drop_index(op.f("ix_seller_product_product_id"), table_name="seller_product")
    op.drop_table("seller_product")
