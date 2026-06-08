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
    OrganizationInvitation,
    OrganizationType,
)
from app.modules.organization.repositories import (
    OrganizationInvitationRepository,
    OrganizationRepository,
    UserOrganizationRepository,
)
from app.modules.organization.services.provider_seller_link_service import (
    ProviderSellerLinkService,
)
from app.modules.organization.services.organization_service import OrganizationService
from app.modules.user.models import User
from app.modules.user.repositories.user_repository import UserRepository


class InvitationService:
    def __init__(
        self,
        invitation_repo: OrganizationInvitationRepository,
        user_org_repo: UserOrganizationRepository,
        org_repo: OrganizationRepository,
        link_service: ProviderSellerLinkService,
        organization_service: OrganizationService,
        user_repo: UserRepository,
    ) -> None:
        self._invitation_repo = invitation_repo
        self._user_org_repo = user_org_repo
        self._org_repo = org_repo
        self._link_service = link_service
        self._organization_service = organization_service
        self._user_repo = user_repo

    async def _require_provider_org(self, organization_id: UUID) -> None:
        org = await self._org_repo.get_by_id(organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        if org.type != OrganizationType.provider:
            raise HTTPException(status_code=403, detail="Forbidden")

    async def create_member_invite(
        self,
        organization_id: UUID,
        created_by_user_id: UUID,
    ) -> InvitationCreatedResponse:
        token = secrets.token_urlsafe(32)
        invitation = OrganizationInvitation(
            organization_id=organization_id,
            kind=InvitationKind.member_invite,
            status=InvitationStatus.pending,
            token=token,
            user_id=None,
            created_by_user_id=created_by_user_id,
        )
        created = await self._invitation_repo.create(invitation)
        return InvitationCreatedResponse.model_validate(created)

    async def create_seller_invite(
        self,
        organization_id: UUID,
        created_by_user_id: UUID,
    ) -> InvitationCreatedResponse:
        await self._require_provider_org(organization_id)
        token = secrets.token_urlsafe(32)
        invitation = OrganizationInvitation(
            organization_id=organization_id,
            kind=InvitationKind.seller_invite,
            status=InvitationStatus.pending,
            token=token,
            user_id=None,
            created_by_user_id=created_by_user_id,
        )
        created = await self._invitation_repo.create(invitation)
        return InvitationCreatedResponse.model_validate(created)

    async def create_seller_join_request(
        self,
        organization_id: UUID,
        user_id: UUID,
    ) -> InvitationPublic:
        await self._require_provider_org(organization_id)
        seller_org = await self._user_org_repo.get_seller_org_for_user(user_id)
        if seller_org is not None:
            if await self._link_service.has_active_link(seller_org.id, organization_id):
                raise HTTPException(status_code=400, detail="Already linked to this provider")
        existing = await self._invitation_repo.get_pending_seller_join_request(
            organization_id,
            user_id,
        )
        if existing is not None:
            raise HTTPException(status_code=409, detail="Join request already pending")
        invitation = OrganizationInvitation(
            organization_id=organization_id,
            kind=InvitationKind.seller_join_request,
            status=InvitationStatus.pending,
            token=None,
            user_id=user_id,
            created_by_user_id=user_id,
        )
        created = await self._invitation_repo.create(invitation)
        return InvitationPublic.model_validate(created)

    async def accept_by_token(self, user: User, token: str) -> MemberPublic:
        invitation = await self._invitation_repo.get_by_token(token)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")

        if invitation.kind == InvitationKind.member_invite:
            return await self._accept_member_invite(user.id, invitation)
        if invitation.kind == InvitationKind.seller_invite:
            return await self._accept_seller_invite(user, invitation)
        raise HTTPException(status_code=400, detail="Invalid invitation type")

    async def _accept_member_invite(
        self,
        user_id: UUID,
        invitation: OrganizationInvitation,
    ) -> MemberPublic:
        if await self._user_org_repo.is_active_member(
            user_id,
            invitation.organization_id,
            throw_exception=False,
        ):
            raise HTTPException(status_code=409, detail="Already an active member")
        await self._user_org_repo.upsert_membership(
            user_id,
            invitation.organization_id,
            is_active=True,
        )
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.accepted},
        )
        updated = await self._user_org_repo.get_membership(user_id, invitation.organization_id)
        assert updated is not None
        return MemberPublic.model_validate(updated)

    async def _accept_seller_invite(
        self,
        user: User,
        invitation: OrganizationInvitation,
    ) -> MemberPublic:
        provider_org = await self._org_repo.get_by_id(invitation.organization_id)
        if provider_org is None or provider_org.type != OrganizationType.provider:
            raise HTTPException(status_code=400, detail="Invalid invitation")
        seller_org = await self._organization_service.ensure_seller_org_for_user(user)
        await self._link_service.link(provider_org.id, seller_org.id)
        await self._user_org_repo.upsert_membership(
            user.id,
            seller_org.id,
            is_active=True,
        )
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.accepted},
        )
        updated = await self._user_org_repo.get_membership(user.id, seller_org.id)
        assert updated is not None
        return MemberPublic.model_validate(updated)

    async def accept_seller_join_request(
        self,
        invitation_id: UUID,
        provider_organization_id: UUID,
    ) -> MemberPublic:
        await self._require_provider_org(provider_organization_id)
        invitation = await self._invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.organization_id != provider_organization_id:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind != InvitationKind.seller_join_request:
            raise HTTPException(status_code=400, detail="Invalid invitation type")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        if invitation.user_id is None:
            raise HTTPException(status_code=400, detail="Invalid seller join request")

        user = await self._user_repo.get_by_id(invitation.user_id)
        if user is None:
            raise HTTPException(status_code=400, detail="Invalid seller join request")

        seller_org = await self._organization_service.ensure_seller_org_for_user(user)
        await self._link_service.link(provider_organization_id, seller_org.id)
        await self._user_org_repo.upsert_membership(
            user.id,
            seller_org.id,
            is_active=True,
        )
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.accepted},
        )
        updated = await self._user_org_repo.get_membership(user.id, seller_org.id)
        assert updated is not None
        return MemberPublic.model_validate(updated)

    async def reject_seller_join_request(
        self,
        invitation_id: UUID,
        provider_organization_id: UUID,
    ) -> InvitationPublic:
        await self._require_provider_org(provider_organization_id)
        invitation = await self._invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.organization_id != provider_organization_id:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind != InvitationKind.seller_join_request:
            raise HTTPException(status_code=400, detail="Invalid invitation type")
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        await self._invitation_repo.update(
            invitation,
            {"status": InvitationStatus.rejected},
        )
        return InvitationPublic.model_validate(invitation)

    async def cancel_invite(
        self,
        invitation_id: UUID,
        organization_id: UUID,
    ) -> None:
        invitation = await self._invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Invitation not found")
        if invitation.kind not in (
            InvitationKind.member_invite,
            InvitationKind.seller_invite,
        ):
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
        rows = await self._invitation_repo.list_pending_seller_join_requests_for_user(user_id)
        return [InvitationPublic.model_validate(r) for r in rows]
