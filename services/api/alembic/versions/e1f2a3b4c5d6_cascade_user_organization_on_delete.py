"""cascade user_organization on organization delete

Revision ID: e1f2a3b4c5d6
Revises: d4e5f6a7b8c9
Create Date: 2026-05-26

"""

from collections.abc import Sequence

from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: str | Sequence[str] | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

FK_NAME = "user_organization_organization_id_fkey"


def upgrade() -> None:
    op.drop_constraint(FK_NAME, "user_organization", type_="foreignkey")
    op.create_foreign_key(
        FK_NAME,
        "user_organization",
        "organization",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(FK_NAME, "user_organization", type_="foreignkey")
    op.create_foreign_key(
        FK_NAME,
        "user_organization",
        "organization",
        ["organization_id"],
        ["id"],
    )
