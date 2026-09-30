"""Commission multi-currency amounts: one unpaid commission per order+provider.

Revision ID: m8n9o0p1q2r3
Revises: l7m8n9o0p1q2
Create Date: 2026-09-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "m8n9o0p1q2r3"
down_revision: str | Sequence[str] | None = "l7m8n9o0p1q2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_currency = postgresql.ENUM("cup", "usd", name="currency", create_type=False)


def upgrade() -> None:
    op.create_table(
        "commission_amount",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("commission_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", _currency, nullable=False),
        sa.ForeignKeyConstraint(
            ["commission_id"],
            ["commission.id"],
            name=op.f("fk_commission_amount_commission_id_commission"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "commission_id",
            "currency",
            name="uq_commission_amount_commission_currency",
        ),
    )
    op.create_index(
        op.f("ix_commission_amount_commission_id"),
        "commission_amount",
        ["commission_id"],
        unique=False,
    )

    op.execute(
        sa.text(
            """
            INSERT INTO commission_amount (
                id, created_at, updated_at, commission_id, amount, currency
            )
            SELECT gen_random_uuid(), created_at, updated_at, id, amount, currency
            FROM commission
            """
        )
    )

    # Merge unpaid commissions that share order + provider.
    # 1) Re-point FKs from duplicate commissions to the oldest keeper.
    op.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    order_id,
                    provider_organization_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY order_id, provider_organization_id
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM commission
                WHERE is_paid = false
            ),
            dupes AS (
                SELECT
                    r.id AS dupe_id,
                    k.id AS keep_id
                FROM ranked r
                JOIN ranked k
                  ON k.order_id = r.order_id
                 AND k.provider_organization_id = r.provider_organization_id
                 AND k.rn = 1
                WHERE r.rn > 1
            )
            UPDATE order_item oi
            SET commission_id = d.keep_id
            FROM dupes d
            WHERE oi.commission_id = d.dupe_id
            """
        )
    )
    op.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    order_id,
                    provider_organization_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY order_id, provider_organization_id
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM commission
                WHERE is_paid = false
            ),
            dupes AS (
                SELECT
                    r.id AS dupe_id,
                    k.id AS keep_id
                FROM ranked r
                JOIN ranked k
                  ON k.order_id = r.order_id
                 AND k.provider_organization_id = r.provider_organization_id
                 AND k.rn = 1
                WHERE r.rn > 1
            )
            UPDATE order_item_commission_component oicc
            SET commission_id = d.keep_id
            FROM dupes d
            WHERE oicc.commission_id = d.dupe_id
            """
        )
    )

    # 2) Add dupe amounts onto keeper when currency already exists.
    op.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    order_id,
                    provider_organization_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY order_id, provider_organization_id
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM commission
                WHERE is_paid = false
            ),
            dupes AS (
                SELECT
                    r.id AS dupe_id,
                    k.id AS keep_id
                FROM ranked r
                JOIN ranked k
                  ON k.order_id = r.order_id
                 AND k.provider_organization_id = r.provider_organization_id
                 AND k.rn = 1
                WHERE r.rn > 1
            )
            UPDATE commission_amount keeper
            SET amount = keeper.amount + dupe.amount
            FROM dupes d
            JOIN commission_amount dupe ON dupe.commission_id = d.dupe_id
            WHERE keeper.commission_id = d.keep_id
              AND keeper.currency = dupe.currency
            """
        )
    )

    # 3) Move dupe amount rows whose currency is missing on the keeper.
    op.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    order_id,
                    provider_organization_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY order_id, provider_organization_id
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM commission
                WHERE is_paid = false
            ),
            dupes AS (
                SELECT
                    r.id AS dupe_id,
                    k.id AS keep_id
                FROM ranked r
                JOIN ranked k
                  ON k.order_id = r.order_id
                 AND k.provider_organization_id = r.provider_organization_id
                 AND k.rn = 1
                WHERE r.rn > 1
            )
            UPDATE commission_amount dupe
            SET commission_id = d.keep_id
            FROM dupes d
            WHERE dupe.commission_id = d.dupe_id
              AND NOT EXISTS (
                  SELECT 1
                  FROM commission_amount keeper
                  WHERE keeper.commission_id = d.keep_id
                    AND keeper.currency = dupe.currency
              )
            """
        )
    )

    # 4) Delete remaining amount rows on dupes, then delete duplicate commissions.
    op.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    order_id,
                    provider_organization_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY order_id, provider_organization_id
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM commission
                WHERE is_paid = false
            )
            DELETE FROM commission_amount
            WHERE commission_id IN (SELECT id FROM ranked WHERE rn > 1)
            """
        )
    )
    op.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    order_id,
                    provider_organization_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY order_id, provider_organization_id
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM commission
                WHERE is_paid = false
            )
            DELETE FROM commission
            WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
            """
        )
    )

    op.drop_index(
        "uq_commission_unpaid_order_provider_currency",
        table_name="commission",
    )
    op.drop_column("commission", "amount")
    op.drop_column("commission", "currency")
    op.create_index(
        "uq_commission_unpaid_order_provider",
        "commission",
        ["order_id", "provider_organization_id"],
        unique=True,
        postgresql_where=sa.text("is_paid = false"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_commission_unpaid_order_provider",
        table_name="commission",
    )
    op.add_column(
        "commission",
        sa.Column("currency", _currency, nullable=True),
    )
    op.add_column(
        "commission",
        sa.Column("amount", sa.BigInteger(), nullable=True),
    )

    op.execute(
        sa.text(
            """
            UPDATE commission c
            SET
                amount = ca.amount,
                currency = ca.currency
            FROM (
                SELECT DISTINCT ON (commission_id)
                    commission_id, amount, currency
                FROM commission_amount
                ORDER BY commission_id, currency ASC
            ) ca
            WHERE c.id = ca.commission_id
            """
        )
    )
    op.alter_column("commission", "amount", nullable=False)
    op.alter_column("commission", "currency", nullable=False)

    op.create_index(
        "uq_commission_unpaid_order_provider_currency",
        "commission",
        ["order_id", "provider_organization_id", "currency"],
        unique=True,
        postgresql_where=sa.text("is_paid = false"),
    )

    op.drop_index(
        op.f("ix_commission_amount_commission_id"),
        table_name="commission_amount",
    )
    op.drop_table("commission_amount")
