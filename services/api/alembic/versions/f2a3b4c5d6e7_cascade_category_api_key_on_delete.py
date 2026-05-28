"""cascade category and api_key on organization delete

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-05-26

"""

from collections.abc import Sequence

from alembic import op

revision: str = "f2a3b4c5d6e7"
down_revision: str | Sequence[str] | None = "e1f2a3b4c5d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CATEGORY_FK = "category_organization_id_fkey"
API_KEY_FK = "api_key_organization_id_fkey"


def _recreate_fk(
    *,
    name: str,
    source_table: str,
    ondelete: str | None = None,
) -> None:
    op.drop_constraint(name, source_table, type_="foreignkey")
    op.create_foreign_key(
        name,
        source_table,
        "organization",
        ["organization_id"],
        ["id"],
        **({"ondelete": ondelete} if ondelete else {}),
    )


def upgrade() -> None:
    _recreate_fk(name=CATEGORY_FK, source_table="category", ondelete="CASCADE")
    _recreate_fk(name=API_KEY_FK, source_table="api_key", ondelete="CASCADE")


def downgrade() -> None:
    _recreate_fk(name=CATEGORY_FK, source_table="category")
    _recreate_fk(name=API_KEY_FK, source_table="api_key")
