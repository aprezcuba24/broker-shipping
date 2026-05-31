from uuid import UUID

from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.organization.models import (
    InvitationKind,
    InvitationStatus,
    OrganizationInvitation,
)


class OrganizationInvitationRepository(Resource[OrganizationInvitation]):
    async def get_by_token(self, token: str) -> OrganizationInvitation | None:
        result = await self._session.execute(
            select(OrganizationInvitation).where(OrganizationInvitation.token == token),
        )
        return result.scalar_one_or_none()

    async def get_pending_seller_request(
        self,
        organization_id: UUID,
        user_id: UUID,
    ) -> OrganizationInvitation | None:
        result = await self._session.execute(
            select(OrganizationInvitation).where(
                OrganizationInvitation.organization_id == organization_id,
                OrganizationInvitation.user_id == user_id,
                OrganizationInvitation.kind == InvitationKind.seller_request,
                OrganizationInvitation.status == InvitationStatus.pending,
            ),
        )
        return result.scalar_one_or_none()

    async def list_pending_for_organization(
        self,
        organization_id: UUID,
    ) -> list[OrganizationInvitation]:
        result = await self._session.execute(
            select(OrganizationInvitation).where(
                OrganizationInvitation.organization_id == organization_id,
                OrganizationInvitation.status == InvitationStatus.pending,
            ),
        )
        return list(result.scalars().all())

    async def list_pending_seller_requests_for_user(
        self,
        user_id: UUID,
    ) -> list[OrganizationInvitation]:
        result = await self._session.execute(
            select(OrganizationInvitation).where(
                OrganizationInvitation.user_id == user_id,
                OrganizationInvitation.kind == InvitationKind.seller_request,
                OrganizationInvitation.status == InvitationStatus.pending,
            ),
        )
        return list(result.scalars().all())
