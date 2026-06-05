from collections.abc import Awaitable, Callable
from uuid import UUID

from fastapi import HTTPException

from app.modules.organization.models import Organization, OrganizationType, ProviderSellerLink
from app.modules.organization.repositories import (
    OrganizationRepository,
    ProviderSellerLinkRepository,
)


class ProviderSellerLinkService:
    """Provider-seller link rules and orchestration across repositories."""

    def __init__(
        self,
        link_repo: ProviderSellerLinkRepository,
        org_repo: OrganizationRepository,
    ) -> None:
        self._link_repo = link_repo
        self._org_repo = org_repo

    async def _assert_org_types(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
    ) -> None:
        provider = await self._org_repo.get_by_id(provider_organization_id)
        seller = await self._org_repo.get_by_id(seller_organization_id)
        if provider is None or seller is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        if provider.type != OrganizationType.provider:
            raise HTTPException(status_code=400, detail="Expected provider organization")
        if seller.type != OrganizationType.seller:
            raise HTTPException(status_code=400, detail="Expected seller organization")

    async def link(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
    ) -> ProviderSellerLink:
        await self._assert_org_types(provider_organization_id, seller_organization_id)
        return await self._link_repo.link(provider_organization_id, seller_organization_id)

    async def has_active_link(
        self,
        seller_organization_id: UUID,
        provider_organization_id: UUID,
    ) -> bool:
        return await self._link_repo.has_active_link(
            seller_organization_id,
            provider_organization_id,
        )

    async def set_link_active(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
        *,
        is_active: bool,
    ) -> ProviderSellerLink:
        link = await self._link_repo.set_link_active(
            provider_organization_id,
            seller_organization_id,
            is_active=is_active,
        )
        if link is None:
            raise HTTPException(status_code=404, detail="Provider-seller link not found")
        return link

    async def list_active_provider_ids(self, seller_organization_id: UUID) -> list[UUID]:
        return await self._link_repo.list_active_provider_ids(seller_organization_id)

    async def _list_linked_organizations(
        self,
        organization_id: UUID,
        list_linked_ids: Callable[[UUID], Awaitable[list[UUID]]],
    ) -> list[Organization]:
        linked_ids = await list_linked_ids(organization_id)
        return list(await self._org_repo.list_by_ids(linked_ids))

    async def list_linked_seller_organizations(
        self,
        provider_organization_id: UUID,
    ) -> list[Organization]:
        return await self._list_linked_organizations(
            provider_organization_id,
            self._link_repo.list_active_seller_org_ids,
        )

    async def list_linked_provider_organizations(
        self,
        seller_organization_id: UUID,
    ) -> list[Organization]:
        return await self._list_linked_organizations(
            seller_organization_id,
            self._link_repo.list_active_provider_ids,
        )
