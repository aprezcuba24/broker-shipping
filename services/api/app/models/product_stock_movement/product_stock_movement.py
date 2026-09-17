from datetime import datetime

from sqlalchemy import Column, Enum as SAEnum
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.lib.utils import utc_now
from app.models.product_stock_movement.enums import (
    StockMovementDirection,
    StockMovementKind,
)


class ProductStockMovement(OrganizationEntityModel, table=True):
    __tablename__ = "product_stock_movement"

    kind: StockMovementKind = Field(
        sa_column=Column(
            SAEnum(
                StockMovementKind,
                values_callable=lambda x: [e.value for e in x],
                name="stockmovementkind",
            ),
            nullable=False,
        ),
    )
    direction: StockMovementDirection = Field(
        sa_column=Column(
            SAEnum(
                StockMovementDirection,
                values_callable=lambda x: [e.value for e in x],
                name="stockmovementdirection",
            ),
            nullable=False,
        ),
    )
    moved_at: datetime = Field(default_factory=utc_now, index=True)
    notes: str | None = Field(default=None, max_length=1000)
