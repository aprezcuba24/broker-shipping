"""add customer address tables and order snapshots

Revision ID: m1n2o3p4q5r6
Revises: l0m1n2o3p4q5
Create Date: 2026-06-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "m1n2o3p4q5r6"
down_revision: str | Sequence[str] | None = "l0m1n2o3p4q5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "customer",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("identification", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "phone", name="uq_customer_org_phone"),
        sa.UniqueConstraint(
            "organization_id",
            "identification",
            name="uq_customer_org_identification",
        ),
    )
    op.create_index(
        op.f("ix_customer_organization_id"),
        "customer",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "address",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("province", sa.String(length=255), nullable=False),
        sa.Column("municipality", sa.String(length=255), nullable=False),
        sa.Column("district", sa.String(length=255), nullable=False),
        sa.Column("neighborhood", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("reference", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["customer_id"], ["customer.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_address_customer_id"),
        "address",
        ["customer_id"],
        unique=False,
    )

    op.execute('DELETE FROM order_line')
    op.execute('DELETE FROM "order"')

    op.drop_constraint("order_customer_id_fkey", "order", type_="foreignkey")
    op.add_column(
        "order",
        sa.Column(
            "customer_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "address_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.create_foreign_key(
        "order_customer_id_fkey",
        "order",
        "customer",
        ["customer_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.alter_column("order", "customer_snapshot", server_default=None)
    op.alter_column("order", "address_snapshot", server_default=None)


def downgrade() -> None:
    op.execute('DELETE FROM order_line')
    op.execute('DELETE FROM "order"')

    op.drop_constraint("order_customer_id_fkey", "order", type_="foreignkey")
    op.drop_column("order", "address_snapshot")
    op.drop_column("order", "customer_snapshot")
    op.create_foreign_key(
        "order_customer_id_fkey",
        "order",
        "user",
        ["customer_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.drop_index(op.f("ix_address_customer_id"), table_name="address")
    op.drop_table("address")
    op.drop_index(op.f("ix_customer_organization_id"), table_name="customer")
    op.drop_table("customer")
