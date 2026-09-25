"""Add phone_blacklist table.

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-09-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f1a2b3c4d5e6"
down_revision: str | Sequence[str] | None = "e0f1a2b3c4d5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

phoneblacklistreason = postgresql.ENUM(
    "nonpayment",
    "fraud",
    "abuse",
    "other",
    name="phoneblacklistreason",
    create_type=False,
)


def upgrade() -> None:
    phoneblacklistreason.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "phone_blacklist",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "reason",
            phoneblacklistreason,
            nullable=False,
        ),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("withdrawn_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["user.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organization.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_phone_blacklist_organization_id"),
        "phone_blacklist",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_phone_blacklist_created_by_user_id"),
        "phone_blacklist",
        ["created_by_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_phone_blacklist_phone",
        "phone_blacklist",
        ["phone"],
        unique=False,
    )
    op.create_index(
        "uq_phone_blacklist_active_org_phone",
        "phone_blacklist",
        ["organization_id", "phone"],
        unique=True,
        postgresql_where=sa.text("withdrawn_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_phone_blacklist_active_org_phone",
        table_name="phone_blacklist",
        postgresql_where=sa.text("withdrawn_at IS NULL"),
    )
    op.drop_index("ix_phone_blacklist_phone", table_name="phone_blacklist")
    op.drop_index(
        op.f("ix_phone_blacklist_created_by_user_id"),
        table_name="phone_blacklist",
    )
    op.drop_index(
        op.f("ix_phone_blacklist_organization_id"),
        table_name="phone_blacklist",
    )
    op.drop_table("phone_blacklist")
    phoneblacklistreason.drop(op.get_bind(), checkfirst=True)
