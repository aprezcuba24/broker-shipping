from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.order.enums import Currency


class CommissionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    provider_organization_id: UUID
    seller_organization_id: UUID
    amount: int
    currency: Currency
    is_paid: bool
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    order_item_ids: list[UUID] = Field(default_factory=list)


class CommissionMarkPaid(BaseModel):
    """Confirm marking a commission as paid. Body may be empty ``{}``."""
