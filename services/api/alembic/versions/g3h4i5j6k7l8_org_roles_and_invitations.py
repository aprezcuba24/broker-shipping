"""org roles is_active and organization_invitation

Revision ID: g3h4i5j6k7l8
Revises: 071a66174520
Create Date: 2026-05-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "g3h4i5j6k7l8"
down_revision: Union[str, Sequence[str], None] = "071a66174520"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

orgmemberrole = postgresql.ENUM("provider", "seller", name="orgmemberrole", create_type=False)
invitationkind = postgresql.ENUM(
    "provider_invite",
    "seller_request",
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
    postgresql.ENUM("provider", "seller", name="orgmemberrole").create(bind, checkfirst=True)
    postgresql.ENUM("provider_invite", "seller_request", name="invitationkind").create(
        bind,
        checkfirst=True,
    )
    postgresql.ENUM(
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        name="invitationstatus",
    ).create(bind, checkfirst=True)

    op.add_column(
        "user_organization",
        sa.Column(
            "role",
            orgmemberrole,
            nullable=False,
            server_default="provider",
        ),
    )
    op.add_column(
        "user_organization",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("user_organization", "role", server_default=None)
    op.alter_column("user_organization", "is_active", server_default=None)

    op.create_table(
        "organization_invitation",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("kind", invitationkind, nullable=False),
        sa.Column("member_role", orgmemberrole, nullable=False),
        sa.Column(
            "status",
            invitationstatus,
            nullable=False,
            server_default="pending",
        ),
        sa.Column("token", sa.String(length=64), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index(
        op.f("ix_organization_invitation_token"),
        "organization_invitation",
        ["token"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_organization_invitation_token"), table_name="organization_invitation")
    op.drop_table("organization_invitation")
    op.drop_column("user_organization", "is_active")
    op.drop_column("user_organization", "role")
    bind = op.get_bind()
    postgresql.ENUM(name="invitationstatus").drop(bind, checkfirst=True)
    postgresql.ENUM(name="invitationkind").drop(bind, checkfirst=True)
    postgresql.ENUM(name="orgmemberrole").drop(bind, checkfirst=True)
