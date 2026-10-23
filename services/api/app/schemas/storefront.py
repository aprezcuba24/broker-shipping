from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.customer import AddressCreate
from app.schemas.fields import NonEmptyStr, NormalizedPhone
from app.schemas.money import Money


class StorefrontInfoPublic(BaseModel):
    organization_id: UUID
    name: str


class StorefrontTagPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class StorefrontProductPublic(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    price: Money
    stock: int
    image_url: str | None = None
    tags: list[StorefrontTagPublic] = Field(default_factory=list)


class StorefrontCheckoutItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)


class StorefrontCheckoutCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    ci: NonEmptyStr = Field(max_length=50)
    phone: NormalizedPhone = Field(max_length=50)
    address: AddressCreate
    items: list[StorefrontCheckoutItemCreate] = Field(min_length=1)


class StorefrontCheckoutItemPublic(BaseModel):
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: Money
    line_total: Money


class StorefrontCheckoutPublic(BaseModel):
    order_id: UUID
    code: str
    items: list[StorefrontCheckoutItemPublic]
    totals: list[Money] = Field(default_factory=list)
