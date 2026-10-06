"""Platform product entitlements (organization-scoped)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.access import ensure_organization_access
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.user.user import User
from app.services import platform_product as platform_product_service
from app.services.provider_seller_link import list_seller_org_ids_for_user
from app.types import PlatformProductCode


async def ensure_platform_product_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    code: PlatformProductCode,
) -> None:
    await platform_product_service.ensure_organization_has_product(
        session,
        organization_id,
        code,
    )


async def ensure_organization_access_with_product(
    session: AsyncSession,
    user: User,
    *,
    organization_id: UUID,
    required_org_type: OrganizationType | None,
    product_code: PlatformProductCode,
) -> Organization:
    organization = await ensure_organization_access(
        session,
        user,
        organization_id=organization_id,
        required_org_type=required_org_type,
    )
    await ensure_platform_product_for_organization(
        session,
        organization.id,
        product_code,
    )
    return organization


async def ensure_any_seller_org_has_product(
    session: AsyncSession,
    user: User,
    code: PlatformProductCode,
) -> None:
    seller_org_ids = await list_seller_org_ids_for_user(session, user.id)
    enabled = await platform_product_service.filter_organization_ids_with_product(
        session,
        seller_org_ids,
        code,
    )
    if not enabled:
        from app.lib.exceptions import raise_api_error

        raise_api_error(
            "product_not_enabled",
            product_name=platform_product_service.product_display_name(code),
        )
