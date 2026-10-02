"""add order share channel attribution

Revision ID: p1q2r3s4t5u6
Revises: o0p1q2r3s4t5
Create Date: 2026-09-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "p1q2r3s4t5u6"
down_revision: str | Sequence[str] | None = "o0p1q2r3s4t5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

sharechannel = postgresql.ENUM(
    "IG",
    "FB",
    "TT",
    "WA",
    "YT",
    "OT",
    name="sharechannel",
    create_type=False,
)


def upgrade() -> None:
    sharechannel.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "order_item",
        sa.Column("share_channel", sharechannel, nullable=True),
    )
    op.create_table(
        "order_share_conversion",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("share_channel", sharechannel, nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["order.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["seller_organization_id"],
            ["organization.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "order_id",
            "share_channel",
            name="uq_order_share_conversion_order_channel",
        ),
    )
    op.create_index(
        op.f("ix_order_share_conversion_order_id"),
        "order_share_conversion",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_share_conversion_seller_organization_id"),
        "order_share_conversion",
        ["seller_organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_order_share_conversion_seller_channel_created",
        "order_share_conversion",
        ["seller_organization_id", "share_channel", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_order_share_conversion_seller_channel_created",
        table_name="order_share_conversion",
    )
    op.drop_index(
        op.f("ix_order_share_conversion_seller_organization_id"),
        table_name="order_share_conversion",
    )
    op.drop_index(
        op.f("ix_order_share_conversion_order_id"),
        table_name="order_share_conversion",
    )
    op.drop_table("order_share_conversion")
    op.drop_column("order_item", "share_channel")
    sharechannel.drop(op.get_bind(), checkfirst=True)
