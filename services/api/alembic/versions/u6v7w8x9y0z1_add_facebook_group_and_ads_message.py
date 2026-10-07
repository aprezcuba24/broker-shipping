"""Add facebook_group and ads_message tables.

Revision ID: u6v7w8x9y0z1
Revises: t5u6v7w8x9y0
Create Date: 2026-10-07

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "u6v7w8x9y0z1"
down_revision: str | Sequence[str] | None = "t5u6v7w8x9y0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "facebook_group",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("facebook_id", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "facebook_id",
            name="uq_facebook_group_organization_id_facebook_id",
        ),
    )
    op.create_index(
        op.f("ix_facebook_group_facebook_id"),
        "facebook_group",
        ["facebook_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_facebook_group_name"),
        "facebook_group",
        ["name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_facebook_group_organization_id"),
        "facebook_group",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "ads_message",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("photo_key", sa.String(length=512), nullable=True),
        sa.Column("code", sa.String(length=4), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ads_message_code"),
        "ads_message",
        ["code"],
        unique=True,
    )
    op.create_index(
        op.f("ix_ads_message_organization_id"),
        "ads_message",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ads_message_title"),
        "ads_message",
        ["title"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ads_message_title"), table_name="ads_message")
    op.drop_index(op.f("ix_ads_message_organization_id"), table_name="ads_message")
    op.drop_index(op.f("ix_ads_message_code"), table_name="ads_message")
    op.drop_table("ads_message")
    op.drop_index(
        op.f("ix_facebook_group_organization_id"),
        table_name="facebook_group",
    )
    op.drop_index(op.f("ix_facebook_group_name"), table_name="facebook_group")
    op.drop_index(op.f("ix_facebook_group_facebook_id"), table_name="facebook_group")
    op.drop_table("facebook_group")
