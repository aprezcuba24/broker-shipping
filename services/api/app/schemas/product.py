from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.order.enums import Currency
from app.schemas.fields import NonEmptyStr
from app.schemas.tag import TagPublic


class ProductCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    tag_ids: list[UUID] = Field(default_factory=list)
    price: Decimal = Field(default=Decimal("0"), ge=0)
    commission: Decimal = Field(default=Decimal("0"), ge=0)
    currency: Currency = Currency.cup


class ProductUpdate(ProductCreate):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    tag_ids: list[UUID] | None = None
    price: Decimal | None = Field(default=None, ge=0)
    commission: Decimal | None = Field(default=None, ge=0)
    currency: Currency | None = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    price: Decimal
    commission: Decimal
    currency: Currency
    created_at: datetime
    updated_at: datetime | None
    tags: list[TagPublic] = Field(default_factory=list)
