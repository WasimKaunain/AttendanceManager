"""add_performed_by_name_role_to_audit_logs

Revision ID: c1d2e3f4a5b6
Revises: 12282e9c99cd
Create Date: 2026-03-12 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = '12282e9c99cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add performed_by_name and performed_by_role columns to audit_logs table.
    - performed_by_name: human-readable name of the person who triggered the action
      (admin's employee_name, or site incharge's employee_name/username)
    - performed_by_role: 'admin' | 'site_incharge' | 'system'
    """
    op.add_column(
        'audit_logs',
        sa.Column('performed_by_name', sa.String(), nullable=True)
    )
    op.add_column(
        'audit_logs',
        sa.Column('performed_by_role', sa.String(), nullable=True)
    )

    # Back-fill existing rows as 'System'
    op.execute(
        "UPDATE audit_logs SET performed_by_name = 'System', performed_by_role = 'system' "
        "WHERE performed_by_name IS NULL"
    )


def downgrade() -> None:
    """Remove the two new columns."""
    op.drop_column('audit_logs', 'performed_by_role')
    op.drop_column('audit_logs', 'performed_by_name')
