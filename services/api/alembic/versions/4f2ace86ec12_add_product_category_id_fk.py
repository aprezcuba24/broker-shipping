"""add product category_id fk

Revision ID: 4f2ace86ec12
Revises: f2a3b4c5d6e7
Create Date: 2026-05-27 22:37:59.238041

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f2ace86ec12'
down_revision: Union[str, Sequence[str], None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('product', sa.Column('category_id', sa.Uuid(), nullable=False))
    op.create_index(op.f('ix_product_category_id'), 'product', ['category_id'], unique=False)
    op.create_foreign_key(
        'fk_product_category_id_category',
        'product',
        'category',
        ['category_id'],
        ['id'],
        ondelete='RESTRICT',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_product_category_id_category', 'product', type_='foreignkey')
    op.drop_index(op.f('ix_product_category_id'), table_name='product')
    op.drop_column('product', 'category_id')
