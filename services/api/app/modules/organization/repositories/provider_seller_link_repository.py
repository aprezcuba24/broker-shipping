from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import InstrumentedAttribute

from app.lib.persistence import Resource
from app.modules.organization.models import ProviderSellerLink


class ProviderSellerLinkRepository(Resource[ProviderSellerLink]):
    async def link(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
    ) -> ProviderSellerLink:
        existing = await self.get_link(provider_organization_id, seller_organization_id)
        if existing is not None:
            if existing.is_active:
                return existing
            updated = await self.set_link_active(
                provider_organization_id,
                seller_organization_id,
                is_active=True,
            )
            assert updated is not None
            return updated
        link = ProviderSellerLink(
            provider_organization_id=provider_organization_id,
            seller_organization_id=seller_organization_id,
            is_active=True,
        )
        self._session.add(link)
        await self._session.flush()
        return link

    async def get_link(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
    ) -> ProviderSellerLink | None:
        result = await self._session.execute(
            select(ProviderSellerLink).where(
                ProviderSellerLink.provider_organization_id == provider_organization_id,
                ProviderSellerLink.seller_organization_id == seller_organization_id,
            ),
        )
        return result.scalar_one_or_none()

    async def has_active_link(
        self,
        seller_organization_id: UUID,
        provider_organization_id: UUID,
    ) -> bool:
        link = await self.get_link(provider_organization_id, seller_organization_id)
        return link is not None and link.is_active

    async def _list_active_linked_organization_ids(
        self,
        *,
        filter_on: InstrumentedAttribute[UUID],
        select_column: InstrumentedAttribute[UUID],
        organization_id: UUID,
    ) -> list[UUID]:
        result = await self._session.execute(
            select(select_column).where(
                filter_on == organization_id,
                ProviderSellerLink.is_active.is_(True),
            ),
        )
        return list(result.scalars().all())

    async def list_active_provider_ids(self, seller_organization_id: UUID) -> list[UUID]:
        return await self._list_active_linked_organization_ids(
            filter_on=ProviderSellerLink.seller_organization_id,
            select_column=ProviderSellerLink.provider_organization_id,
            organization_id=seller_organization_id,
        )

    async def list_active_seller_org_ids(self, provider_organization_id: UUID) -> list[UUID]:
        return await self._list_active_linked_organization_ids(
            filter_on=ProviderSellerLink.provider_organization_id,
            select_column=ProviderSellerLink.seller_organization_id,
            organization_id=provider_organization_id,
        )

    async def set_link_active(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
        *,
        is_active: bool,
    ) -> ProviderSellerLink | None:
        link = await self.get_link(provider_organization_id, seller_organization_id)
        if link is None:
            return None
        link.is_active = is_active
        self._session.add(link)
        await self._session.flush()
        return link
