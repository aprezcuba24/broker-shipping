from uuid import UUID

from fastapi import HTTPException

from app.modules.organization.models import MemberPublic, Organization
from app.modules.organization.repositories import UserOrganizationRepository
from app.modules.organization.services.provider_seller_link_service import (
    ProviderSellerLinkService,
)


class MembershipService:
    """Member listing and provider-seller link management."""

    def __init__(
        self,
        user_org_repo: UserOrganizationRepository,
        link_service: ProviderSellerLinkService,
    ) -> None:
        self._user_org_repo = user_org_repo
        self._link_service = link_service

    async def list_members(self, organization_id: UUID) -> list[MemberPublic]:
        rows = await self._user_org_repo.list_by_organization(organization_id)
        return [MemberPublic.model_validate(r) for r in rows]

    async def set_member_is_active(
        self,
        organization_id: UUID,
        target_user_id: UUID,
        *,
        is_active: bool,
    ) -> MemberPublic:
        membership = await self._user_org_repo.get_membership(target_user_id, organization_id)
        if membership is None:
            raise HTTPException(status_code=404, detail="Member not found")
        updated = await self._user_org_repo.set_is_active(
            target_user_id,
            organization_id,
            is_active=is_active,
        )
        assert updated is not None
        return MemberPublic.model_validate(updated)

    async def list_linked_sellers(self, provider_organization_id: UUID) -> list[Organization]:
        return await self._link_service.list_linked_seller_organizations(provider_organization_id)

    async def set_seller_link_active(
        self,
        provider_organization_id: UUID,
        seller_organization_id: UUID,
        *,
        is_active: bool,
    ) -> None:
        await self._link_service.set_link_active(
            provider_organization_id,
            seller_organization_id,
            is_active=is_active,
        )
