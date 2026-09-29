"""Add neighborhood table and wire address/order.

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-09-28

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "h3i4j5k6l7m8"
down_revision: str | Sequence[str] | None = "g2h3i4j5k6l7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "neighborhood",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("municipality_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["municipality_id"],
            ["municipality.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "municipality_id",
            "name",
            name="uq_neighborhood_municipality_id_name",
        ),
    )
    op.create_index(
        op.f("ix_neighborhood_municipality_id"),
        "neighborhood",
        ["municipality_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_neighborhood_name"),
        "neighborhood",
        ["name"],
        unique=False,
    )

    op.add_column(
        "address",
        sa.Column("neighborhood_id", sa.Uuid(), nullable=True),
    )
    op.create_index(
        op.f("ix_address_neighborhood_id"),
        "address",
        ["neighborhood_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_address_neighborhood_id_neighborhood",
        "address",
        "neighborhood",
        ["neighborhood_id"],
        ["id"],
    )

    op.add_column(
        "order",
        sa.Column(
            "customer_neighborhood_name",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )


def downgrade() -> None:
    op.drop_column("order", "customer_neighborhood_name")

    op.drop_constraint(
        "fk_address_neighborhood_id_neighborhood",
        "address",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_address_neighborhood_id"), table_name="address")
    op.drop_column("address", "neighborhood_id")

    op.drop_index(op.f("ix_neighborhood_name"), table_name="neighborhood")
    op.drop_index(op.f("ix_neighborhood_municipality_id"), table_name="neighborhood")
    op.drop_table("neighborhood")
