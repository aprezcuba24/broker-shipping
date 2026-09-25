from datetime import datetime
from typing import Annotated, Self
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.schemas.customer import CustomerPublic
from app.schemas.organization import OrganizationPublic


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    seller_provider_price: int = Field(default=0, ge=0)
    customer_change: int = Field(default=0, ge=0)


def _assert_unique_product_ids(items: list[OrderItemCreate]) -> list[OrderItemCreate]:
    product_ids = [item.product_id for item in items]
    if len(product_ids) != len(set(product_ids)):
        raise ValueError("Duplicate product_id in order items")
    return items


OrderPreviewItems = Annotated[
    list[OrderItemCreate],
    Field(min_length=1),
    AfterValidator(_assert_unique_product_ids),
]


class OrderCreate(BaseModel):
    customer_id: UUID
    items: list[OrderItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_product_ids(self) -> Self:
        _assert_unique_product_ids(self.items)
        return self


class OrderItemStatusUpdate(BaseModel):
    status: OrderItemStatus


class OrderItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    product_id: UUID
    product_name: str = ""
    product_image_url: str | None = None
    provider_organization_id: UUID
    provider_organization_name: str = ""
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
    customer: CustomerPublic | None = None
    seller_organization: OrganizationPublic | None = None
