from __future__ import annotations

from app.models.organization.organization import Organization
from app.schemas.storefront import StorefrontInfoPublic


def get_storefront_info(organization: Organization) -> StorefrontInfoPublic:
    return StorefrontInfoPublic(
        organization_id=organization.id,
        name=organization.name,
    )
