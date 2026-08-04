"""add commission table

Revision ID: n4b5c6d7e8f9
Revises: m3a4b5c6d7e8
Create Date: 2026-08-02

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "n4b5c6d7e8f9"
down_revision: str | Sequence[str] | None = "m3a4b5c6d7e8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

currency = postgresql.ENUM(
    "cup",
    "usd",
    name="currency",
    create_type=False,
)


def upgrade() -> None:
    op.create_table(
        "commission",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", currency, nullable=False),
        sa.Column(
            "is_paid",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["order.id"],
            name=op.f("fk_commission_order_id_order"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["provider_organization_id"],
            ["organization.id"],
            name=op.f("fk_commission_provider_organization_id_organization"),
        ),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            name=op.f("fk_commission_seller_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_commission_order_id"),
        "commission",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_commission_provider_organization_id"),
        "commission",
        ["provider_organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_commission_seller_organization_id"),
        "commission",
        ["seller_organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_commission_provider_organization_id_is_paid",
        "commission",
        ["provider_organization_id", "is_paid"],
        unique=False,
    )
    op.create_index(
        "uq_commission_unpaid_order_provider_currency",
        "commission",
        ["order_id", "provider_organization_id", "currency"],
        unique=True,
        postgresql_where=sa.text("is_paid = false"),
    )

    op.add_column(
        "order_item",
        sa.Column("commission_id", sa.Uuid(), nullable=True),
    )
    op.create_index(
        op.f("ix_order_item_commission_id"),
        "order_item",
        ["commission_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("fk_order_item_commission_id_commission"),
        "order_item",
        "commission",
        ["commission_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_order_item_commission_id_commission"),
        "order_item",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_order_item_commission_id"), table_name="order_item")
    op.drop_column("order_item", "commission_id")

    op.drop_index(
        "uq_commission_unpaid_order_provider_currency",
        table_name="commission",
    )
    op.drop_index(
        "ix_commission_provider_organization_id_is_paid",
        table_name="commission",
    )
    op.drop_index(
        op.f("ix_commission_seller_organization_id"),
        table_name="commission",
    )
    op.drop_index(
        op.f("ix_commission_provider_organization_id"),
        table_name="commission",
    )
    op.drop_index(op.f("ix_commission_order_id"), table_name="commission")
    op.drop_table("commission")
