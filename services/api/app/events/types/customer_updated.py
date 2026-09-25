from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.events.types.entity_updated import EntityUpdated
from app.models.customer.customer import Customer


@dataclass(frozen=True)
class CustomerSnapshot:
    id: UUID
    name: str
    ci: str
    phone: str
    purchase_tier: int
    seller_organization_id: UUID
    created_at: datetime
    updated_at: datetime | None


def customer_snapshot(customer: Customer) -> CustomerSnapshot:
    return CustomerSnapshot(
        id=customer.id,
        name=customer.name,
        ci=customer.ci,
        phone=customer.phone,
        purchase_tier=customer.purchase_tier,
        seller_organization_id=customer.seller_organization_id,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
    )


@dataclass(frozen=True)
class CustomerUpdated(EntityUpdated[CustomerSnapshot]):
    """Emitted after a customer is created or updated."""
