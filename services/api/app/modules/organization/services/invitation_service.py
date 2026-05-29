from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import HTTPException

from app.modules.organization.models import (
    InvitationCreatedResponse,
    InvitationKind,
    InvitationPublic,
    InvitationStatus,
    MemberPublic,
    OrgMemberRole,
    OrganizationInvitation,
)
from app.modules.organization.repositories import (
    OrganizationInvitationRepository,
    UserOrganizationRepository,
)


class InvitationService:
    def __init__(
        self,
        invitation_repo: OrganizationInvitationRepository,
        user_org_repo: UserOrganizationRepository,
    ) -> None:
        self._invitation_repo = invitation_repo
        self._user_org_repo = user_org_repo

    async def create_provider_invite(
        self,
        organization_id: UUID,
        created_by_user_id: UUID,
        member_role: OrgMemberRole,
    ) -> InvitationCreatedResponse:
        token = secrets.token_urlsafe(32)
        invitation = OrganizationInvitation(
            organization_id=organization_id,
            kind=InvitationKind.provider_invite,
            member_role=member_role,
            status=InvitationStatus.pending,
            token=token,
            user_id=None,
            created_by_user_id=created_by_user_id,
        )
        created = await self._invitation_repo.create(invitation)
        return InvitationCreatedResponse.model_validate(created)

    async def create_seller_request(
        self,
        organization_id: UUID,
        user_id: UUID,
    ) -> InvitationPublic:
        existing = await self._invitation_repo.get_pending_seller_request(
            organization_id,
            user_id,
        )
        if existing is not None:
            raise HTTPException(status_code=409, detail="Join request already pending")
        invitation = OrganizationInvitation(
            organization_id=organization_id,
            kind=InvitationKind.seller_request,
            member_role=OrgMemberRole.seller,
            status=InvitationStatus.pending,
            token=None,
            user_id=user_id,
            created_by_user_id=user_id,
        )
        created = await self._invitation_repo.create(invitation)
        return InvitationPublic.model_validate(created)

    async def accept_by_token(self, user_id: UUID, token: str) -> MemberPublic:
        invitation = await self._invitation_repo.get_by_token(token)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind != InvitationKind.provider_invite:
            raise HTTPException(status_code=400, detail="Invalid invitation type")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        membership = await self._user_org_repo.get_membership(
            user_id,
            invitation.organization_id,
        )
        if membership is not None and membership.is_active:
            raise HTTPException(status_code=409, detail="Already an active member")
        await self._user_org_repo.upsert_membership(
            user_id,
            invitation.organization_id,
            role=invitation.member_role,
            is_active=True,
        )
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.accepted},
        )
        updated = await self._user_org_repo.get_membership(user_id, invitation.organization_id)
        assert updated is not None
        return MemberPublic.model_validate(updated)

    async def accept_seller_request(
        self,
        invitation_id: UUID,
        provider_user_id: UUID,
    ) -> MemberPublic:
        invitation = await self._invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind != InvitationKind.seller_request:
            raise HTTPException(status_code=400, detail="Invalid invitation type")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        if invitation.user_id is None:
            raise HTTPException(status_code=400, detail="Invalid seller request")
        if await self._user_org_repo.is_active_member(
            invitation.user_id,
            invitation.organization_id,
            throw_exception=False,
        ):
            raise HTTPException(status_code=409, detail="User is already an active member")
        await self._user_org_repo.upsert_membership(
            invitation.user_id,
            invitation.organization_id,
            role=OrgMemberRole.seller,
            is_active=True,
        )
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.accepted},
        )
        updated = await self._user_org_repo.get_membership(
            invitation.user_id,
            invitation.organization_id,
        )
        assert updated is not None
        return MemberPublic.model_validate(updated)

    async def reject_seller_request(
        self,
        invitation_id: UUID,
    ) -> InvitationPublic:
        invitation = await self._invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind != InvitationKind.seller_request:
            raise HTTPException(status_code=400, detail="Invalid invitation type")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.rejected},
        )
        return InvitationPublic.model_validate(invitation)

    async def cancel_provider_invite(
        self,
        invitation_id: UUID,
    ) -> None:
        invitation = await self._invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind != InvitationKind.provider_invite:
            raise HTTPException(status_code=400, detail="Invalid invitation type")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.cancelled},
        )

    async def list_pending_for_organization(
        self,
        organization_id: UUID,
    ) -> list[InvitationPublic]:
        rows = await self._invitation_repo.list_pending_for_organization(organization_id)
        return [InvitationPublic.model_validate(r) for r in rows]

    async def list_my_pending_requests(self, user_id: UUID) -> list[InvitationPublic]:
        rows = await self._invitation_repo.list_pending_seller_requests_for_user(user_id)
        return [InvitationPublic.model_validate(r) for r in rows]
