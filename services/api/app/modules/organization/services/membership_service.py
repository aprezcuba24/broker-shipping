from uuid import UUID

from app.modules.organization.repositories import UserOrganizationRepository


class MembershipService:
    """Thin facade for membership checks from routes."""

    def __init__(self, user_org_repo: UserOrganizationRepository) -> None:
        self._user_org_repo = user_org_repo

    async def is_member(self, user_id: UUID, organization_id: UUID) -> bool:
        return await self._user_org_repo.is_member(user_id, organization_id)
