"""add organization_invitation table

Revision ID: g7a8b9c0d1e2
Revises: f6a7b8c9d0e1
Create Date: 2026-07-26

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "g7a8b9c0d1e2"
down_revision: str | Sequence[str] | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

invitationkind = postgresql.ENUM(
    "member_invite",
    "seller_link_invite",
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


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("organization_invitation"):
        op.drop_index(
            op.f("ix_organization_invitation_token"),
            table_name="organization_invitation",
            if_exists=True,
        )
        op.drop_table("organization_invitation")

    # Recreate invitationkind when a stale enum exists (e.g. from metadata.create_all).
    invitationkind.drop(bind, checkfirst=True)
    invitationstatus.create(bind, checkfirst=True)
    invitationkind.create(bind, checkfirst=True)

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


def downgrade() -> None:
    op.drop_index(
        op.f("ix_organization_invitation_token"),
        table_name="organization_invitation",
    )
    op.drop_table("organization_invitation")
    bind = op.get_bind()
    invitationstatus.drop(bind, checkfirst=True)
    invitationkind.drop(bind, checkfirst=True)
