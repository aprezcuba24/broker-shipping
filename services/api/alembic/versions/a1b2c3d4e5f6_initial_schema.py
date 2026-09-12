"""initial schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-09-12

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

organizationtype = postgresql.ENUM(
    "provider",
    "seller",
    name="organizationtype",
    create_type=False,
)
invitationkind = postgresql.ENUM(
    "member_invite",
    "seller_link_request",
    name="invitationkind",
    create_type=False,
)
invitationstatus = postgresql.ENUM(
    "pending",
    "accepted",
    "rejected",
    "cancelled",
    name="invitationstatus",
    create_type=False,
)
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
    organizationtype.create(bind, checkfirst=True)
    invitationkind.create(bind, checkfirst=True)
    invitationstatus.create(bind, checkfirst=True)
    currency.create(bind, checkfirst=True)
    orderstatus.create(bind, checkfirst=True)
    orderitemstatus.create(bind, checkfirst=True)

    op.create_table(
        "user",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "is_super_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("email_verified_at", sa.DateTime(), nullable=True),
        sa.Column(
            "email_verification_token_hash",
            sa.String(length=64),
            nullable=True,
        ),
        sa.Column("email_verification_expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.create_index(
        op.f("ix_user_is_super_admin"),
        "user",
        ["is_super_admin"],
        unique=False,
    )

    op.create_table(
        "organization",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", organizationtype, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_organization",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", "organization_id"),
    )

    op.create_table(
        "provider_seller_link",
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("linked_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["provider_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "provider_organization_id",
            "seller_organization_id",
        ),
    )

    op.create_table(
        "api_key",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("prefix", sa.String(length=12), nullable=False),
        sa.Column("secret_hash", sa.String(length=64), nullable=False),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["user.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_api_key_created_by_user_id"),
        "api_key",
        ["created_by_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_api_key_prefix"), "api_key", ["prefix"], unique=True)

    op.create_table(
        "organization_invitation",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("counterparty_organization_id", sa.Uuid(), nullable=True),
        sa.Column("kind", invitationkind, nullable=False),
        sa.Column("status", invitationstatus, nullable=False),
        sa.Column("token", sa.String(length=64), nullable=True),
        sa.Column("invitee_email", sa.String(length=255), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["counterparty_organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_organization_invitation_token"),
        "organization_invitation",
        ["token"],
        unique=True,
    )

    op.create_table(
        "product",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "currency",
            currency,
            server_default="cup",
            nullable=False,
        ),
        sa.Column(
            "price",
            sa.BigInteger(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "commission",
            sa.BigInteger(),
            server_default="0",
            nullable=False,
        ),
        sa.Column("image_key", sa.String(length=512), nullable=True),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            name=op.f("fk_product_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_name"), "product", ["name"], unique=False)
    op.create_index(
        op.f("ix_product_organization_id"),
        "product",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "tag",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            name=op.f("fk_tag_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "name",
            name="uq_tag_organization_id_name",
        ),
    )
    op.create_index(op.f("ix_tag_name"), "tag", ["name"], unique=False)
    op.create_index(
        op.f("ix_tag_organization_id"),
        "tag",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "product_tag",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["product.id"],
            name=op.f("fk_product_tag_product_id_product"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tag.id"],
            name=op.f("fk_product_tag_tag_id_tag"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("product_id", "tag_id"),
    )

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
        sa.UniqueConstraint(
            "seller_organization_id",
            "phone",
            name="uq_customer_seller_phone",
        ),
    )
    op.create_index(
        op.f("ix_customer_seller_organization_id"),
        "customer",
        ["seller_organization_id"],
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

    op.create_table(
        "order_item",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column("unit_provider_price", sa.BigInteger(), nullable=False),
        sa.Column("seller_provider_price", sa.BigInteger(), nullable=False),
        sa.Column(
            "customer_change",
            sa.BigInteger(),
            server_default="0",
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("currency", currency, nullable=False),
        sa.Column("status", orderitemstatus, nullable=False),
        sa.Column("seller_commission", sa.BigInteger(), nullable=False),
        sa.Column("commission_id", sa.Uuid(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["commission_id"],
            ["commission.id"],
            name=op.f("fk_order_item_commission_id_commission"),
            ondelete="SET NULL",
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
        op.f("ix_order_item_commission_id"),
        "order_item",
        ["commission_id"],
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
    op.drop_index(op.f("ix_order_item_commission_id"), table_name="order_item")
    op.drop_index(
        op.f("ix_order_item_provider_organization_id"),
        table_name="order_item",
    )
    op.drop_index(op.f("ix_order_item_product_id"), table_name="order_item")
    op.drop_index(op.f("ix_order_item_order_id"), table_name="order_item")
    op.drop_table("order_item")

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

    op.drop_index(op.f("ix_order_customer_id"), table_name="order")
    op.drop_index(op.f("ix_order_seller_organization_id"), table_name="order")
    op.drop_index(op.f("ix_order_code"), table_name="order")
    op.drop_table("order")

    op.drop_index(op.f("ix_address_municipality_id"), table_name="address")
    op.drop_index(op.f("ix_address_province_id"), table_name="address")
    op.drop_index(op.f("ix_address_customer_id"), table_name="address")
    op.drop_table("address")

    op.drop_index(
        op.f("ix_customer_seller_organization_id"),
        table_name="customer",
    )
    op.drop_table("customer")

    op.drop_index(op.f("ix_municipality_province_id"), table_name="municipality")
    op.drop_index(op.f("ix_municipality_name"), table_name="municipality")
    op.drop_table("municipality")

    op.drop_index(op.f("ix_province_name"), table_name="province")
    op.drop_table("province")

    op.drop_table("product_tag")
    op.drop_index(op.f("ix_tag_organization_id"), table_name="tag")
    op.drop_index(op.f("ix_tag_name"), table_name="tag")
    op.drop_table("tag")

    op.drop_index(op.f("ix_product_organization_id"), table_name="product")
    op.drop_index(op.f("ix_product_name"), table_name="product")
    op.drop_table("product")

    op.drop_index(
        op.f("ix_organization_invitation_token"),
        table_name="organization_invitation",
    )
    op.drop_table("organization_invitation")

    op.drop_index(op.f("ix_api_key_prefix"), table_name="api_key")
    op.drop_index(op.f("ix_api_key_created_by_user_id"), table_name="api_key")
    op.drop_table("api_key")

    op.drop_table("provider_seller_link")
    op.drop_table("user_organization")
    op.drop_table("organization")

    op.drop_index(op.f("ix_user_is_super_admin"), table_name="user")
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_table("user")

    bind = op.get_bind()
    orderitemstatus.drop(bind, checkfirst=True)
    orderstatus.drop(bind, checkfirst=True)
    currency.drop(bind, checkfirst=True)
    invitationstatus.drop(bind, checkfirst=True)
    invitationkind.drop(bind, checkfirst=True)
    organizationtype.drop(bind, checkfirst=True)
