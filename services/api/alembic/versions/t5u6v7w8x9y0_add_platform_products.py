"""Add platform_product and organization_platform_product.

Revision ID: t5u6v7w8x9y0
Revises: s4t5u6v7w8x9
Create Date: 2026-10-06

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "t5u6v7w8x9y0"
down_revision: str | Sequence[str] | None = "s4t5u6v7w8x9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

platformproductcode = postgresql.ENUM(
    "phone_blacklist",
    "provider_management",
    "facebook_publishing",
    name="platformproductcode",
    create_type=False,
)

CATALOG: tuple[tuple[str, str, str | None], ...] = (
    ("phone_blacklist", "Lista negra", "Consulta y reporte de teléfonos en lista negra."),
    (
        "provider_management",
        "Gestión de productos de proveedores",
        "Catálogo, pedidos, comisiones y operación comercial.",
    ),
    (
        "facebook_publishing",
        "Publicación en Facebook",
        "Publicación de mensajes en grupos de Facebook (futuro).",
    ),
)

DEFAULT_CODES = ("phone_blacklist", "provider_management")


def upgrade() -> None:
    platformproductcode.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "platform_product",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("code", platformproductcode, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_platform_product_code"),
    )
    op.create_table(
        "organization_platform_product",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("platform_product_id", sa.Uuid(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("granted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["platform_product_id"],
            ["platform_product.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("organization_id", "platform_product_id"),
    )

    conn = op.get_bind()
    for code, name, description in CATALOG:
        conn.execute(
            sa.text(
                """
                INSERT INTO platform_product (id, created_at, code, name, description)
                VALUES (gen_random_uuid(), NOW() AT TIME ZONE 'UTC', :code, :name, :description)
                """
            ),
            {"code": code, "name": name, "description": description},
        )

    for code in DEFAULT_CODES:
        conn.execute(
            sa.text(
                """
                INSERT INTO organization_platform_product (
                    organization_id, platform_product_id, enabled, granted_at
                )
                SELECT o.id, p.id, TRUE, NOW() AT TIME ZONE 'UTC'
                FROM organization o
                CROSS JOIN platform_product p
                WHERE p.code = :code
                """
            ),
            {"code": code},
        )


def downgrade() -> None:
    op.drop_table("organization_platform_product")
    op.drop_table("platform_product")
    platformproductcode.drop(op.get_bind(), checkfirst=True)
