from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization.enums import OrganizationType
from app.services import platform_product as platform_product_service
from app.types import DEFAULT_PLATFORM_PRODUCT_CODES, PlatformProductCode
from app.models.organization.organization import Organization
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.models.organization.provider_settings import ProviderSettings
from app.models.organization.user_organization import UserOrganization


async def create_organization_for_user(
    session: AsyncSession,
    *,
    user_id: UUID | str,
    name: str | None = None,
    org_type: OrganizationType = OrganizationType.provider,
    platform_product_codes: list[PlatformProductCode] | None = None,
) -> dict:
    uid = user_id if isinstance(user_id, UUID) else UUID(str(user_id))
    entity = Organization(name=name or "Test Org", type=org_type)
    session.add(entity)
    await session.flush()
    session.add(
        UserOrganization(
            user_id=uid,
            organization_id=entity.id,
            is_active=True,
        ),
    )
    await session.flush()
    await session.commit()
    codes = (
        list(DEFAULT_PLATFORM_PRODUCT_CODES)
        if platform_product_codes is None
        else platform_product_codes
    )
    if codes:
        await platform_product_service.grant_products_for_organization(
            session,
            entity.id,
            codes=codes,
        )
    return entity.model_dump(mode="json")


async def set_provider_messaging_accepts(
    session: AsyncSession,
    *,
    provider_organization_id: UUID | str,
    accepts_unconfigured_neighborhoods: bool,
) -> None:
    org_id = UUID(str(provider_organization_id))
    existing = await session.execute(
        select(ProviderSettings).where(ProviderSettings.organization_id == org_id)
    )
    settings = existing.scalar_one_or_none()
    if settings is None:
        settings = ProviderSettings(
            organization_id=org_id,
            accepts_unconfigured_neighborhoods=accepts_unconfigured_neighborhoods,
        )
    else:
        settings.accepts_unconfigured_neighborhoods = (
            accepts_unconfigured_neighborhoods
        )
    session.add(settings)
    await session.flush()
    await session.commit()


async def link_provider_to_seller(
    session: AsyncSession,
    *,
    provider_organization_id: UUID | str,
    seller_organization_id: UUID | str,
    accepts_unconfigured_neighborhoods: bool | None = True,
) -> None:
    """Link provider to seller.

    By default enables accepts_unconfigured_neighborhoods so existing order
    tests keep working. Pass None to leave provider settings untouched
    (API default false).
    """
    link = ProviderSellerLink(
        provider_organization_id=UUID(str(provider_organization_id)),
        seller_organization_id=UUID(str(seller_organization_id)),
        is_active=True,
    )
    session.add(link)
    await session.flush()
    await session.commit()
    if accepts_unconfigured_neighborhoods is not None:
        await set_provider_messaging_accepts(
            session,
            provider_organization_id=provider_organization_id,
            accepts_unconfigured_neighborhoods=accepts_unconfigured_neighborhoods,
        )


class OrganizationFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        user_id: UUID | str,
        name: str | None = None,
        org_type: OrganizationType = OrganizationType.provider,
        platform_product_codes: list[PlatformProductCode] | None = None,
    ) -> dict:
        self._n += 1
        final_name = name or f"ORG-{self._n:04d}"
        return await create_organization_for_user(
            self._session,
            user_id=user_id,
            name=final_name,
            org_type=org_type,
            platform_product_codes=platform_product_codes,
        )

    async def build_seller(
        self,
        *,
        user_id: UUID | str,
        name: str | None = None,
        platform_product_codes: list[PlatformProductCode] | None = None,
    ) -> dict:
        return await self.build(
            user_id=user_id,
            name=name,
            org_type=OrganizationType.seller,
            platform_product_codes=platform_product_codes,
        )
