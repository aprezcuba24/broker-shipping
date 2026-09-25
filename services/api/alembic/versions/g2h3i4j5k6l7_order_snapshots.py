"""Add immutable order and order_item snapshot columns.

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2026-09-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "g2h3i4j5k6l7"
down_revision: str | Sequence[str] | None = "f1a2b3c4d5e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "order",
        sa.Column(
            "seller_organization_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "customer_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "customer_ci",
            sa.String(length=50),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "customer_phone",
            sa.String(length=50),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "customer_address",
            sa.String(length=500),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "customer_province_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order",
        sa.Column(
            "customer_municipality_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )

    op.add_column(
        "order_item",
        sa.Column(
            "product_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "order_item",
        sa.Column("product_image_key", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "order_item",
        sa.Column(
            "provider_organization_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )

    op.execute(
        """
        UPDATE "order" o
        SET
            seller_organization_name = COALESCE(seller_org.name, ''),
            customer_name = COALESCE(c.name, ''),
            customer_ci = COALESCE(c.ci, ''),
            customer_phone = COALESCE(c.phone, '')
        FROM organization seller_org, customer c
        WHERE seller_org.id = o.seller_organization_id
          AND c.id = o.customer_id
        """
    )
    op.execute(
        """
        WITH latest_address AS (
            SELECT DISTINCT ON (a.customer_id)
                a.customer_id,
                a.address,
                p.name AS province_name,
                m.name AS municipality_name
            FROM address a
            JOIN province p ON p.id = a.province_id
            JOIN municipality m ON m.id = a.municipality_id
            ORDER BY a.customer_id, a.created_at DESC, a.id DESC
        )
        UPDATE "order" o
        SET
            customer_address = COALESCE(la.address, ''),
            customer_province_name = COALESCE(la.province_name, ''),
            customer_municipality_name = COALESCE(la.municipality_name, '')
        FROM latest_address la
        WHERE la.customer_id = o.customer_id
        """
    )
    op.execute(
        """
        UPDATE order_item oi
        SET
            product_name = COALESCE(p.name, ''),
            product_image_key = p.image_key,
            provider_organization_name = COALESCE(provider_org.name, '')
        FROM product p, organization provider_org
        WHERE p.id = oi.product_id
          AND provider_org.id = oi.provider_organization_id
        """
    )

    op.alter_column("order", "seller_organization_name", server_default=None)
    op.alter_column("order", "customer_name", server_default=None)
    op.alter_column("order", "customer_ci", server_default=None)
    op.alter_column("order", "customer_phone", server_default=None)
    op.alter_column("order", "customer_address", server_default=None)
    op.alter_column("order", "customer_province_name", server_default=None)
    op.alter_column("order", "customer_municipality_name", server_default=None)
    op.alter_column("order_item", "product_name", server_default=None)
    op.alter_column("order_item", "provider_organization_name", server_default=None)


def downgrade() -> None:
    op.drop_column("order_item", "provider_organization_name")
    op.drop_column("order_item", "product_image_key")
    op.drop_column("order_item", "product_name")
    op.drop_column("order", "customer_municipality_name")
    op.drop_column("order", "customer_province_name")
    op.drop_column("order", "customer_address")
    op.drop_column("order", "customer_phone")
    op.drop_column("order", "customer_ci")
    op.drop_column("order", "customer_name")
    op.drop_column("order", "seller_organization_name")
