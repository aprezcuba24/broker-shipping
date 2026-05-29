"""merge product category fk and org roles

Revision ID: 5189ba849f86
Revises: 4f2ace86ec12, g3h4i5j6k7l8
Create Date: 2026-05-29 14:09:33.177993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5189ba849f86'
down_revision: Union[str, Sequence[str], None] = ('4f2ace86ec12', 'g3h4i5j6k7l8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
