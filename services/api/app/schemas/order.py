from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.order.enums import Currency, OrderItemStatus, OrderStatus


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    seller_provider_price: int = Field(default=0, ge=0)
    customer_change: int = Field(default=0, ge=0)


OrderPreviewItems = Annotated[list[OrderItemCreate], Field(min_length=1)]


class OrderCreate(BaseModel):
    customer_id: UUID
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemStatusUpdate(BaseModel):
    status: OrderItemStatus


class OrderItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    product_id: UUID
    provider_organization_id: UUID
    unit_provider_price: int
    seller_provider_price: int
    customer_change: int
    quantity: int
    currency: Currency
    status: OrderItemStatus
    seller_commission: int
    created_at: datetime
    updated_at: datetime | None


class OrderCurrencyTotal(BaseModel):
    currency: Currency
    amount: int


class OrderPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    seller_organization_id: UUID
    customer_id: UUID
    status: OrderStatus
    created_at: datetime
    updated_at: datetime | None
    items: list[OrderItemPublic] = Field(default_factory=list)
    totals: list[OrderCurrencyTotal] = Field(default_factory=list)
