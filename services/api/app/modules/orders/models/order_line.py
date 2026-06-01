from typing import Any
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from app.lib.persistence import EntityModel


class OrderLine(EntityModel, table=True):
    __tablename__ = "order_line"

    order_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    product_id: UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("product.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
    )
    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    product_snapshot: dict[str, Any] = Field(
        sa_column=Column(JSONB, nullable=False),
        description=(
            "Product data at purchase time, e.g. name, category_id, organization_id."
        ),
    )
