from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.order.enums import Currency
from app.schemas.money import Money

_ZERO_CUP = Money(amount=0, currency=Currency.cup)


class MessagingPriceCreate(BaseModel):
    neighborhood_id: UUID
    price: Money = Field(default_factory=lambda: _ZERO_CUP.model_copy())


class MessagingPriceUpdate(BaseModel):
    price: Money | None = None


class MessagingPricePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    neighborhood_id: UUID
    neighborhood_name: str | None = None
    municipality_id: UUID | None = None
    municipality_name: str | None = None
    province_id: UUID | None = None
    province_name: str | None = None
    price: Money
    created_at: datetime
    updated_at: datetime | None = None


class MessagingSettingsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    accepts_unconfigured_neighborhoods: bool = False


class MessagingSettingsUpdate(BaseModel):
    accepts_unconfigured_neighborhoods: bool


class OrderMessagingCreate(BaseModel):
    price: Money


class OrderMessagingUpdate(BaseModel):
    price: Money


class OrderMessagingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    provider_organization_id: UUID
    provider_organization_name: str = ""
    neighborhood_id: UUID
    neighborhood_name: str = ""
    price: Money
    created_at: datetime
    updated_at: datetime | None = None
