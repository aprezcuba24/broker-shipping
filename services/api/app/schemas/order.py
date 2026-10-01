from datetime import datetime
from typing import Annotated, Self
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from app.models.order.enums import OrderItemStatus, OrderStatus
from app.models.product.enums import ShareChannel
from app.schemas.customer import CustomerPublic
from app.schemas.fields import OptionalStrippedStr
from app.schemas.messaging import OrderMessagingPublic
from app.schemas.money import Money
from app.schemas.organization import OrganizationPublic

# Semantic alias: currency bucket within order totals.
OrderCurrencyTotal = Money


class OrderTotals(BaseModel):
    """Order money totals broken down by source, each grouped by currency."""

    products: list[OrderCurrencyTotal] = Field(default_factory=list)
    messaging: list[OrderCurrencyTotal] = Field(default_factory=list)
    total: list[OrderCurrencyTotal] = Field(default_factory=list)


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    seller_provider_price: Money | None = None
    customer_change: Money | None = None
    share_code: OptionalStrippedStr = None


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
    unit_provider_price: Money
    seller_provider_price: Money
    customer_change: Money
    quantity: int
    status: OrderItemStatus
    seller_commission: Money
    seller_commissions: list[Money] = Field(default_factory=list)
    share_channel: ShareChannel | None = None
    created_at: datetime
    updated_at: datetime | None


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
    messaging: list[OrderMessagingPublic] = Field(default_factory=list)
    totals: OrderTotals = Field(default_factory=OrderTotals)
    customer: CustomerPublic | None = None
    seller_organization: OrganizationPublic | None = None
