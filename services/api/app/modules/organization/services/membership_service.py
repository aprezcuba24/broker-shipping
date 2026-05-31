from uuid import UUID

from fastapi import HTTPException

from app.modules.organization.models import MemberPublic, OrgMemberRole
from app.modules.organization.repositories import UserOrganizationRepository


class MembershipService:
    """Member listing and activation for organization routes."""

    def __init__(self, user_org_repo: UserOrganizationRepository) -> None:
        self._user_org_repo = user_org_repo

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
        if membership.role != OrgMemberRole.seller:
            raise HTTPException(status_code=400, detail="Only sellers can be deactivated")
        updated = await self._user_org_repo.set_is_active(
            target_user_id,
            organization_id,
            is_active=is_active,
        )
        assert updated is not None
        return MemberPublic.model_validate(updated)
