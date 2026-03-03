"""Add reorder_level to inventory

Revision ID: 002
Revises: 001
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Add reorder_level column with default value of 10
    op.add_column('inventory', sa.Column('reorder_level', sa.Integer(), nullable=False, server_default='10'))

def downgrade():
    op.drop_column('inventory', 'reorder_level')
