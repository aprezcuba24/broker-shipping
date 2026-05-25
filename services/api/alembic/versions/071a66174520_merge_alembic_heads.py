"""merge alembic heads

Revision ID: 071a66174520
Revises: a1b2c3d4e5f6, f7b0fc1bc902
Create Date: 2026-05-25 09:34:55.984535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '071a66174520'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'f7b0fc1bc902')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
