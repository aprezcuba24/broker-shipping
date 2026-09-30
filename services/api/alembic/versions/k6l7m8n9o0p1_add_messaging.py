"""Add messaging prices, provider settings, order messaging lines, and order neighborhood id.

Revision ID: k6l7m8n9o0p1
Revises: j5k6l7m8n9o0
Create Date: 2026-09-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "k6l7m8n9o0p1"
down_revision: str | Sequence[str] | None = "j5k6l7m8n9o0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_currency = postgresql.ENUM("cup", "usd", name="currency", create_type=False)


def upgrade() -> None:
    op.add_column(
        "order",
        sa.Column("customer_neighborhood_id", sa.Uuid(), nullable=True),
    )
    op.create_index(
        op.f("ix_order_customer_neighborhood_id"),
        "order",
        ["customer_neighborhood_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_order_customer_neighborhood_id_neighborhood",
        "order",
        "neighborhood",
        ["customer_neighborhood_id"],
        ["id"],
    )

    op.create_table(
        "provider_messaging_price",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", _currency, nullable=False),
        sa.ForeignKeyConstraint(["neighborhood_id"], ["neighborhood.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "neighborhood_id",
            name="uq_provider_messaging_price_org_neighborhood",
        ),
    )
    op.create_index(
        op.f("ix_provider_messaging_price_organization_id"),
        "provider_messaging_price",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_provider_messaging_price_neighborhood_id"),
        "provider_messaging_price",
        ["neighborhood_id"],
        unique=False,
    )

    op.create_table(
        "provider_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column(
            "accepts_unconfigured_neighborhoods",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            name="uq_provider_settings_organization_id",
        ),
    )
    op.create_index(
        op.f("ix_provider_settings_organization_id"),
        "provider_settings",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "order_messaging",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column(
            "provider_organization_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column(
            "neighborhood_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", _currency, nullable=False),
        sa.ForeignKeyConstraint(["neighborhood_id"], ["neighborhood.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["order.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["provider_organization_id"],
            ["organization.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "order_id",
            "provider_organization_id",
            name="uq_order_messaging_order_provider",
        ),
    )
    op.create_index(
        op.f("ix_order_messaging_order_id"),
        "order_messaging",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_messaging_provider_organization_id"),
        "order_messaging",
        ["provider_organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_messaging_neighborhood_id"),
        "order_messaging",
        ["neighborhood_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_order_messaging_neighborhood_id"),
        table_name="order_messaging",
    )
    op.drop_index(
        op.f("ix_order_messaging_provider_organization_id"),
        table_name="order_messaging",
    )
    op.drop_index(op.f("ix_order_messaging_order_id"), table_name="order_messaging")
    op.drop_table("order_messaging")

    op.drop_index(
        op.f("ix_provider_settings_organization_id"),
        table_name="provider_settings",
    )
    op.drop_table("provider_settings")

    op.drop_index(
        op.f("ix_provider_messaging_price_neighborhood_id"),
        table_name="provider_messaging_price",
    )
    op.drop_index(
        op.f("ix_provider_messaging_price_organization_id"),
        table_name="provider_messaging_price",
    )
    op.drop_table("provider_messaging_price")

    op.drop_constraint(
        "fk_order_customer_neighborhood_id_neighborhood",
        "order",
        type_="foreignkey",
    )
    op.drop_index(
        op.f("ix_order_customer_neighborhood_id"),
        table_name="order",
    )
    op.drop_column("order", "customer_neighborhood_id")
