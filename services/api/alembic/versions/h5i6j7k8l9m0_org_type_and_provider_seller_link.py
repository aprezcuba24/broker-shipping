"""organization type, provider_seller_link, drop membership roles

Revision ID: h5i6j7k8l9m0
Revises: ae80ffdd2f54
Create Date: 2026-06-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "h5i6j7k8l9m0"
down_revision: str | Sequence[str] | None = "ae80ffdd2f54"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    organizationtype = postgresql.ENUM("provider", "seller", name="organizationtype")
    organizationtype.create(bind, checkfirst=True)

    op.add_column(
        "organization",
        sa.Column(
            "type",
            organizationtype,
            nullable=False,
            server_default="provider",
        ),
    )
    op.alter_column("organization", "type", server_default=None)

    op.create_table(
        "provider_seller_link",
        sa.Column("provider_organization_id", sa.Uuid(), nullable=False),
        sa.Column("seller_organization_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
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
        sa.PrimaryKeyConstraint("provider_organization_id", "seller_organization_id"),
    )
    op.create_index(
        "ix_provider_seller_link_seller_organization_id",
        "provider_seller_link",
        ["seller_organization_id"],
    )

    op.drop_column("organization_invitation", "member_role")
    op.drop_column("user_organization", "role")

    op.execute(
        """
        ALTER TABLE organization_invitation
        ALTER COLUMN kind TYPE VARCHAR(32) USING kind::text
        """
    )
    op.execute("DROP TYPE invitationkind")
    new_invitationkind = postgresql.ENUM(
        "member_invite",
        "seller_invite",
        "seller_join_request",
        name="invitationkind",
    )
    new_invitationkind.create(bind, checkfirst=True)
    op.execute(
        """
        ALTER TABLE organization_invitation
        ALTER COLUMN kind TYPE invitationkind USING (
            CASE kind
                WHEN 'provider_invite' THEN 'member_invite'
                WHEN 'seller_request' THEN 'seller_join_request'
                ELSE kind
            END
        )::invitationkind
        """
    )

    op.execute("DROP TYPE orgmemberrole")


def downgrade() -> None:
    bind = op.get_bind()
    orgmemberrole = postgresql.ENUM("provider", "seller", name="orgmemberrole")
    orgmemberrole.create(bind, checkfirst=True)

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
        "organization_invitation",
        sa.Column(
            "member_role",
            orgmemberrole,
            nullable=False,
            server_default="provider",
        ),
    )
    op.alter_column("user_organization", "role", server_default=None)
    op.alter_column("organization_invitation", "member_role", server_default=None)

    op.execute(
        """
        ALTER TABLE organization_invitation
        ALTER COLUMN kind TYPE VARCHAR(32) USING kind::text
        """
    )
    op.execute("DROP TYPE invitationkind")
    old_invitationkind = postgresql.ENUM(
        "provider_invite",
        "seller_request",
        name="invitationkind",
    )
    old_invitationkind.create(bind, checkfirst=True)
    op.execute(
        """
        ALTER TABLE organization_invitation
        ALTER COLUMN kind TYPE invitationkind USING (
            CASE kind
                WHEN 'member_invite' THEN 'provider_invite'
                WHEN 'seller_invite' THEN 'provider_invite'
                WHEN 'seller_join_request' THEN 'seller_request'
                ELSE kind
            END
        )::invitationkind
        """
    )

    op.drop_index(
        "ix_provider_seller_link_seller_organization_id",
        table_name="provider_seller_link",
    )
    op.drop_table("provider_seller_link")
    op.drop_column("organization", "type")
    op.execute("DROP TYPE organizationtype")
