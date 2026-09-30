from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.commission.commission import Commission
from app.models.order.commission_component import CommissionComponentKind
from app.schemas.money import Money


class CommissionComponentPublic(BaseModel):
    order_item_id: UUID
    product_name: str
    quantity: int
    kind: CommissionComponentKind
    unit_amount: Money
    line_amount: Money
    unit_provider_price: Money | None = None
    seller_provider_price: Money | None = None


class CommissionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    provider_organization_id: UUID
    seller_organization_id: UUID
    amounts: list[Money] = Field(default_factory=list)
    is_paid: bool
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    order_item_ids: list[UUID] = Field(default_factory=list)
    components: list[CommissionComponentPublic] = Field(default_factory=list)


class CommissionMarkPaid(BaseModel):
    """Confirm marking a commission as paid. Body may be empty ``{}``."""


def commission_to_public(commission: Commission) -> CommissionPublic:
    return CommissionPublic(
        id=commission.id,
        order_id=commission.order_id,
        provider_organization_id=commission.provider_organization_id,
        seller_organization_id=commission.seller_organization_id,
        amounts=list(getattr(commission, "amounts", []) or []),
        is_paid=commission.is_paid,
        paid_at=commission.paid_at,
        created_at=commission.created_at,
        updated_at=commission.updated_at,
        order_item_ids=list(getattr(commission, "order_item_ids", []) or []),
        components=list(getattr(commission, "components", []) or []),
    )
