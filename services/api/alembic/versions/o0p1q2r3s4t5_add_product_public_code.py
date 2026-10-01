"""add product public_code

Revision ID: o0p1q2r3s4t5
Revises: n9o0p1q2r3s4
Create Date: 2026-09-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "o0p1q2r3s4t5"
down_revision: str | Sequence[str] | None = "n9o0p1q2r3s4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_CODE_LENGTH = 4


def _generate_code() -> str:
    import secrets

    return "".join(secrets.choice(_CROCKFORD) for _ in range(_CODE_LENGTH))


def upgrade() -> None:
    op.add_column(
        "product",
        sa.Column("public_code", sa.String(length=4), nullable=True),
    )

    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id FROM product")).fetchall()
    used: set[str] = set()
    for (product_id,) in rows:
        code = _generate_code()
        while code in used:
            code = _generate_code()
        used.add(code)
        connection.execute(
            sa.text(
                "UPDATE product SET public_code = :code WHERE id = :id"
            ),
            {"code": code, "id": product_id},
        )

    op.alter_column(
        "product",
        "public_code",
        existing_type=sa.String(length=4),
        nullable=False,
    )
    op.create_index(
        op.f("ix_product_public_code"),
        "product",
        ["public_code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_product_public_code"), table_name="product")
    op.drop_column("product", "public_code")
