"""drop seller_link_invite from invitationkind

Revision ID: h8b9c0d1e2f3
Revises: g7a8b9c0d1e2
Create Date: 2026-07-27

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "h8b9c0d1e2f3"
down_revision: str | Sequence[str] | None = "g7a8b9c0d1e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

invitationkind_old = postgresql.ENUM(
    "member_invite",
    "seller_link_invite",
    "seller_link_request",
    name="invitationkind",
    create_type=False,
)
invitationkind_new = postgresql.ENUM(
    "member_invite",
    "seller_link_request",
    name="invitationkind",
    create_type=False,
)


def upgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM organization_invitation WHERE kind = 'seller_link_invite'"
        )
    )

    op.execute(sa.text("ALTER TYPE invitationkind RENAME TO invitationkind_old"))
    invitationkind_new.create(op.get_bind(), checkfirst=False)
    op.execute(
        sa.text(
            "ALTER TABLE organization_invitation "
            "ALTER COLUMN kind TYPE invitationkind "
            "USING kind::text::invitationkind"
        )
    )
    op.execute(sa.text("DROP TYPE invitationkind_old"))


def downgrade() -> None:
    op.execute(sa.text("ALTER TYPE invitationkind RENAME TO invitationkind_old"))
    invitationkind_old.create(op.get_bind(), checkfirst=False)
    op.execute(
        sa.text(
            "ALTER TABLE organization_invitation "
            "ALTER COLUMN kind TYPE invitationkind "
            "USING kind::text::invitationkind"
        )
    )
    op.execute(sa.text("DROP TYPE invitationkind_old"))
