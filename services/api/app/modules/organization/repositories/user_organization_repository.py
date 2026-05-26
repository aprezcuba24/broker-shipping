from uuid import UUID

from sqlalchemy import delete, select

from app.lib.persistence import Resource
from app.modules.organization.models import UserOrganization


class UserOrganizationRepository(Resource[UserOrganization]):
    async def add_membership(self, user_id: UUID, organization_id: UUID) -> UserOrganization:
        link = UserOrganization(user_id=user_id, organization_id=organization_id)
        self._session.add(link)
        await self._session.flush()
        return link

    async def list_organization_ids(self, user_id: UUID) -> list[UUID]:
        result = await self._session.execute(
            select(UserOrganization.organization_id).where(
                UserOrganization.user_id == user_id,
            ),
        )
        return list(result.scalars().all())

    async def is_member(self, user_id: UUID, organization_id: UUID) -> bool:
        result = await self._session.execute(
            select(UserOrganization.user_id).where(
                UserOrganization.user_id == user_id,
                UserOrganization.organization_id == organization_id,
            ),
        )
        return result.scalar_one_or_none() is not None

    async def delete_memberships_for_organization(self, organization_id: UUID) -> None:
        await self._session.execute(
            delete(UserOrganization).where(
                UserOrganization.organization_id == organization_id,
            ),
        )
        await self._session.flush()
