from __future__ import annotations

from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProductReceptionItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)


class ProductReceptionCreate(BaseModel):
    received_at: datetime | None = None
    items: list[ProductReceptionItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_product_ids(self) -> Self:
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product_id in reception items")
        return self


class ProductReceptionItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reception_id: UUID
    product_id: UUID
    quantity: int
    created_at: datetime
    updated_at: datetime | None


class ProductReceptionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    received_at: datetime
    created_at: datetime
    updated_at: datetime | None
    items: list[ProductReceptionItemPublic] = Field(default_factory=list)
