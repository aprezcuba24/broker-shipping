"""add order customer location tables

Revision ID: j0d1e2f3a4b5
Revises: i9c0d1e2f3a4
Create Date: 2026-07-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "j0d1e2f3a4b5"
down_revision: str | Sequence[str] | None = "i9c0d1e2f3a4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

currency = postgresql.ENUM(
    "cup",
    "usd",
    name="currency",
    create_type=False,
)
orderstatus = postgresql.ENUM(
    "created",
    "processing",
    "finished",
    "canceled",
    name="orderstatus",
    create_type=False,
)
orderitemstatus = postgresql.ENUM(
    "created",
    "reviewed",
    "sent",
    "delivered",
    "canceled",
    name="orderitemstatus",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    currency.create(bind, checkfirst=True)
    orderstatus.create(bind, checkfirst=True)
    orderitemstatus.create(bind, checkfirst=True)

    op.create_table(
        "province",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_province_name"), "province", ["name"], unique=False)

    op.create_table(
        "municipality",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("province_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["province_id"],
            ["province.id"],
            name=op.f("fk_municipality_province_id_province"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "province_id",
            "name",
            name="uq_municipality_province_id_name",
        ),
    )
    op.create_index(op.f("ix_municipality_name"), "municipality", ["name"], unique=False)
    op.create_index(
        op.f("ix_municipality_province_id"),
        "municipality",
        ["province_id"],
        unique=False,
    )

    op.create_table(
        "customer",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("ci", sa.String(length=50), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            name=op.f("fk_customer_seller_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "seller_organization_id",
            "ci",
            name="uq_customer_seller_ci",
        ),
    )
    op.create_index(
        op.f("ix_customer_seller_organization_id"),
        "customer",
        ["seller_organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_customer_seller_phone",
        "customer",
        ["seller_organization_id", "phone"],
        unique=False,
    )

    op.create_table(
        "address",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("province_id", sa.Uuid(), nullable=False),
        sa.Column("municipality_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customer.id"],
            name=op.f("fk_address_customer_id_customer"),
        ),
        sa.ForeignKeyConstraint(
            ["province_id"],
            ["province.id"],
            name=op.f("fk_address_province_id_province"),
        ),
        sa.ForeignKeyConstraint(
            ["municipality_id"],
            ["municipality.id"],
            name=op.f("fk_address_municipality_id_municipality"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_address_customer_id"),
        "address",
        ["customer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_address_province_id"),
        "address",
        ["province_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_address_municipality_id"),
        "address",
        ["municipality_id"],
        unique=False,
    )

    op.add_column(
        "product",
        sa.Column(
            "currency",
            currency,
            server_default="cup",
            nullable=False,
        ),
    )
    op.add_column(
        "product",
        sa.Column(
            "commission",
            sa.Numeric(precision=12, scale=2),
            server_default="0",
            nullable=False,
        ),
    )

    op.create_table(
        "order",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("status", orderstatus, nullable=False),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            name=op.f("fk_order_seller_organization_id_organization"),
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customer.id"],
            name=op.f("fk_order_customer_id_customer"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "seller_organization_id",
            "code",
            name="uq_order_seller_code",
        ),
    )
    op.create_index(op.f("ix_order_code"), "order", ["code"], unique=False)
    op.create_index(
        op.f("ix_order_seller_organization_id"),
        "order",
        ["seller_organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_customer_id"),
        "order",
        ["customer_id"],
        unique=False,
    )

    op.create_table(
        "order_item",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column("unit_provider_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "seller_provider_price",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column(
            "customer_change",
            sa.Numeric(precision=12, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("currency", currency, nullable=False),
        sa.Column("status", orderitemstatus, nullable=False),
        sa.Column(
            "seller_commission",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.CheckConstraint(
            "quantity > 0",
            name="ck_order_item_quantity_positive",
        ),
        sa.CheckConstraint(
            "seller_provider_price >= unit_provider_price",
            name="ck_order_item_seller_price_gte_provider",
        ),
        sa.CheckConstraint(
            "customer_change >= 0",
            name="ck_order_item_customer_change_non_negative",
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["order.id"],
            name=op.f("fk_order_item_order_id_order"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["product.id"],
            name=op.f("fk_order_item_product_id_product"),
        ),
        sa.ForeignKeyConstraint(
            ["provider_organization_id"],
            ["organization.id"],
            name=op.f("fk_order_item_provider_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_order_item_order_id"),
        "order_item",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_item_product_id"),
        "order_item",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_item_provider_organization_id"),
        "order_item",
        ["provider_organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_order_item_provider_organization_id_status",
        "order_item",
        ["provider_organization_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_order_item_provider_organization_id_status",
        table_name="order_item",
    )
    op.drop_index(
        op.f("ix_order_item_provider_organization_id"),
        table_name="order_item",
    )
    op.drop_index(op.f("ix_order_item_product_id"), table_name="order_item")
    op.drop_index(op.f("ix_order_item_order_id"), table_name="order_item")
    op.drop_table("order_item")

    op.drop_index(op.f("ix_order_customer_id"), table_name="order")
    op.drop_index(op.f("ix_order_seller_organization_id"), table_name="order")
    op.drop_index(op.f("ix_order_code"), table_name="order")
    op.drop_table("order")

    op.drop_column("product", "commission")
    op.drop_column("product", "currency")

    op.drop_index(op.f("ix_address_municipality_id"), table_name="address")
    op.drop_index(op.f("ix_address_province_id"), table_name="address")
    op.drop_index(op.f("ix_address_customer_id"), table_name="address")
    op.drop_table("address")

    op.drop_index("ix_customer_seller_phone", table_name="customer")
    op.drop_index(op.f("ix_customer_seller_organization_id"), table_name="customer")
    op.drop_table("customer")

    op.drop_index(op.f("ix_municipality_province_id"), table_name="municipality")
    op.drop_index(op.f("ix_municipality_name"), table_name="municipality")
    op.drop_table("municipality")

    op.drop_index(op.f("ix_province_name"), table_name="province")
    op.drop_table("province")

    bind = op.get_bind()
    orderitemstatus.drop(bind, checkfirst=True)
    orderstatus.drop(bind, checkfirst=True)
    currency.drop(bind, checkfirst=True)
