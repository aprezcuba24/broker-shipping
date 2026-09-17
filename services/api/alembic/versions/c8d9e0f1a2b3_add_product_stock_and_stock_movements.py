"""add product stock and stock movements

Revision ID: c8d9e0f1a2b3
Revises: b7e8f9a0c1d2
Create Date: 2026-09-17

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c8d9e0f1a2b3"
down_revision: str | Sequence[str] | None = "b7e8f9a0c1d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

stockmovementkind = sa.Enum(
    "reception",
    "shrinkage",
    "correction",
    name="stockmovementkind",
)
stockmovementdirection = sa.Enum(
    "in",
    "out",
    name="stockmovementdirection",
)


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("stock", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "product",
        sa.Column("reserved", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_check_constraint(
        "ck_product_stock_non_negative",
        "product",
        "stock >= 0",
    )
    op.create_check_constraint(
        "ck_product_reserved_non_negative",
        "product",
        "reserved >= 0",
    )

    op.create_unique_constraint(
        "uq_order_item_order_product",
        "order_item",
        ["order_id", "product_id"],
    )

    stockmovementkind.create(op.get_bind(), checkfirst=True)
    stockmovementdirection.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "product_stock_movement",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("kind", stockmovementkind, nullable=False),
        sa.Column("direction", stockmovementdirection, nullable=False),
        sa.Column("moved_at", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
            name=op.f("fk_product_stock_movement_organization_id_organization"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_product_stock_movement_organization_id"),
        "product_stock_movement",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_product_stock_movement_moved_at"),
        "product_stock_movement",
        ["moved_at"],
        unique=False,
    )

    op.create_table(
        "product_stock_movement_item",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("movement_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "quantity > 0",
            name="ck_product_stock_movement_item_quantity_positive",
        ),
        sa.ForeignKeyConstraint(
            ["movement_id"],
            ["product_stock_movement.id"],
            name=op.f(
                "fk_product_stock_movement_item_movement_id_product_stock_movement"
            ),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["product.id"],
            name=op.f("fk_product_stock_movement_item_product_id_product"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "movement_id",
            "product_id",
            name="uq_product_stock_movement_item_movement_product",
        ),
    )
    op.create_index(
        op.f("ix_product_stock_movement_item_movement_id"),
        "product_stock_movement_item",
        ["movement_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_product_stock_movement_item_product_id"),
        "product_stock_movement_item",
        ["product_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_product_stock_movement_item_product_id"),
        table_name="product_stock_movement_item",
    )
    op.drop_index(
        op.f("ix_product_stock_movement_item_movement_id"),
        table_name="product_stock_movement_item",
    )
    op.drop_table("product_stock_movement_item")
    op.drop_index(
        op.f("ix_product_stock_movement_moved_at"),
        table_name="product_stock_movement",
    )
    op.drop_index(
        op.f("ix_product_stock_movement_organization_id"),
        table_name="product_stock_movement",
    )
    op.drop_table("product_stock_movement")
    stockmovementdirection.drop(op.get_bind(), checkfirst=True)
    stockmovementkind.drop(op.get_bind(), checkfirst=True)
    op.drop_constraint(
        "uq_order_item_order_product",
        "order_item",
        type_="unique",
    )
    op.drop_constraint(
        "ck_product_reserved_non_negative",
        "product",
        type_="check",
    )
    op.drop_constraint(
        "ck_product_stock_non_negative",
        "product",
        type_="check",
    )
    op.drop_column("product", "reserved")
    op.drop_column("product", "stock")
