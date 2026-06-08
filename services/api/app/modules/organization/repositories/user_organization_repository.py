from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.organization.models import Organization, OrganizationType, UserOrganization


class UserOrganizationRepository(Resource[UserOrganization]):
    async def add_membership(
        self,
        user_id: UUID,
        organization_id: UUID,
        *,
        is_active: bool = True,
    ) -> UserOrganization:
        link = UserOrganization(
            user_id=user_id,
            organization_id=organization_id,
            is_active=is_active,
        )
        self._session.add(link)
        await self._session.flush()
        return link

    async def get_membership(
        self,
        user_id: UUID,
        organization_id: UUID,
    ) -> UserOrganization | None:
        result = await self._session.execute(
            select(UserOrganization).where(
                UserOrganization.user_id == user_id,
                UserOrganization.organization_id == organization_id,
            ),
        )
        return result.scalar_one_or_none()

    async def list_by_organization(self, organization_id: UUID) -> list[UserOrganization]:
        result = await self._session.execute(
            select(UserOrganization).where(
                UserOrganization.organization_id == organization_id,
            ),
        )
        return list(result.scalars().all())

    async def list_organization_ids(self, user_id: UUID) -> list[UUID]:
        result = await self._session.execute(
            select(UserOrganization.organization_id).where(
                UserOrganization.user_id == user_id,
            ),
        )
        return list(result.scalars().all())

    async def list_organizations_for_user(
        self,
        user_id: UUID,
        *,
        org_type: OrganizationType | None = None,
    ) -> list[Organization]:
        stmt = (
            select(Organization)
            .join(
                UserOrganization,
                UserOrganization.organization_id == Organization.id,
            )
            .where(
                UserOrganization.user_id == user_id,
                UserOrganization.is_active.is_(True),
                Organization.deleted_at.is_(None),
            )
        )
        if org_type is not None:
            stmt = stmt.where(Organization.type == org_type)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_seller_org_for_user(self, user_id: UUID) -> Organization | None:
        orgs = await self.list_organizations_for_user(
            user_id,
            org_type=OrganizationType.seller,
        )
        return orgs[0] if orgs else None

    async def is_active_member(
        self,
        user_id: UUID,
        organization_id: UUID,
        *,
        throw_exception: bool = True,
    ) -> bool:
        membership = await self.get_membership(user_id, organization_id)
        active = membership is not None and membership.is_active
        if not active and throw_exception:
            raise HTTPException(status_code=403, detail="Forbidden")
        return active

    async def upsert_membership(
        self,
        user_id: UUID,
        organization_id: UUID,
        *,
        is_active: bool = True,
    ) -> UserOrganization:
        existing = await self.get_membership(user_id, organization_id)
        if existing is None:
            return await self.add_membership(
                user_id,
                organization_id,
                is_active=is_active,
            )
        existing.is_active = is_active
        self._session.add(existing)
        await self._session.flush()
        return existing

    async def set_is_active(
        self,
        user_id: UUID,
        organization_id: UUID,
        *,
        is_active: bool,
    ) -> UserOrganization | None:
        membership = await self.get_membership(user_id, organization_id)
        if membership is None:
            return None
        membership.is_active = is_active
        self._session.add(membership)
        await self._session.flush()
        return membership
