from __future__ import annotations

from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.product_stock_movement.enums import (
    StockMovementDirection,
    StockMovementKind,
)
from app.schemas.fields import OptionalStrippedStr


class ProductStockMovementItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)


class ProductStockMovementCreate(BaseModel):
    kind: StockMovementKind
    direction: StockMovementDirection | None = None
    moved_at: datetime | None = None
    notes: OptionalStrippedStr = None
    items: list[ProductStockMovementItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_payload(self) -> Self:
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product_id in movement items")
        if self.kind == StockMovementKind.correction:
            if self.direction is None:
                raise ValueError("direction is required for correction movements")
        elif self.direction is not None:
            raise ValueError("direction is only allowed for correction movements")
        return self


class ProductStockMovementItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    movement_id: UUID
    product_id: UUID
    quantity: int
    created_at: datetime
    updated_at: datetime | None


class ProductStockMovementPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    kind: StockMovementKind
    direction: StockMovementDirection
    moved_at: datetime
    notes: str | None
    created_at: datetime
    updated_at: datetime | None
    items: list[ProductStockMovementItemPublic] = Field(default_factory=list)
