from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.events.types import MemberInvitedEvent, SellerLinkRequestedEvent
from app.lib.events import emit
from app.lib.persistence import get_entity
from app.lib.utils import utc_now
from app.models.organization.enums import (
    InvitationKind,
    InvitationStatus,
    OrganizationType,
)
from app.models.organization.organization import Organization
from app.models.organization.organization_invitation import OrganizationInvitation
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User
from app.schemas.invitation import InvitationCreatedResponse, InvitationPublic, MemberPublic
from app.services import organization as org_service
from app.services import provider_seller_link as link_service


async def _require_provider_org(
    session: AsyncSession, organization_id: UUID
) -> Organization:
    org = await get_entity(session, Organization, id=organization_id)
    if org.type != OrganizationType.provider:
        raise HTTPException(status_code=403, detail="Forbidden")
    return org


async def find_pending_seller_link_request(
    session: AsyncSession,
    *,
    provider_organization_id: UUID,
    seller_organization_id: UUID,
) -> OrganizationInvitation | None:
    return await get_entity(
        session,
        OrganizationInvitation,
        organization_id=provider_organization_id,
        counterparty_organization_id=seller_organization_id,
        kind=InvitationKind.seller_link_request,
        status=InvitationStatus.pending,
        required=False,
    )


async def create_member_invite(
    session: AsyncSession,
    *,
    organization_id: UUID,
    created_by_user_id: UUID,
    invitee_email: str,
) -> InvitationCreatedResponse:
    org = await get_entity(session, Organization, id=organization_id)

    token = secrets.token_urlsafe(32)
    invitation = OrganizationInvitation(
        organization_id=organization_id,
        kind=InvitationKind.member_invite,
        status=InvitationStatus.pending,
        token=token,
        invitee_email=invitee_email,
        user_id=None,
        created_by_user_id=created_by_user_id,
    )
    session.add(invitation)
    await session.commit()
    await session.refresh(invitation)

    await emit(
        MemberInvitedEvent(invitation=invitation, organization=org),
        background=True,
    )
    return InvitationCreatedResponse.model_validate(invitation)


async def create_seller_link_request(
    session: AsyncSession,
    *,
    provider_organization_id: UUID,
    seller_organization_id: UUID,
    user_id: UUID,
) -> InvitationPublic:
    provider = await _require_provider_org(session, provider_organization_id)
    seller = await org_service.require_seller_org_membership(
        session, user_id, seller_organization_id
    )

    if await link_service.has_active_link(
        session, provider_organization_id, seller_organization_id
    ):
        raise HTTPException(status_code=400, detail="Already linked to this provider")

    if await find_pending_seller_link_request(
        session,
        provider_organization_id=provider_organization_id,
        seller_organization_id=seller_organization_id,
    ) is not None:
        raise HTTPException(status_code=409, detail="Link request already pending")

    invitation = OrganizationInvitation(
        organization_id=provider_organization_id,
        counterparty_organization_id=seller_organization_id,
        kind=InvitationKind.seller_link_request,
        status=InvitationStatus.pending,
        token=None,
        invitee_email=None,
        user_id=user_id,
        created_by_user_id=user_id,
    )
    session.add(invitation)
    await session.commit()
    await session.refresh(invitation)

    await emit(
        SellerLinkRequestedEvent(
            invitation=invitation,
            provider=provider,
            seller=seller,
        ),
        background=True,
    )
    return InvitationPublic.model_validate(invitation)


async def accept_by_token(
    session: AsyncSession,
    user: User,
    token: str,
) -> MemberPublic:
    invitation = await get_entity(
        session,
        OrganizationInvitation,
        token=token,
        kind=InvitationKind.member_invite,
    )
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="Invitation is not pending")
    return await accept_member_invite(session, user, invitation)


async def accept_member_invite(
    session: AsyncSession,
    user: User,
    invitation: OrganizationInvitation,
) -> MemberPublic:
    if user.email != invitation.invitee_email:
        raise HTTPException(
            status_code=403,
            detail="Invitation email does not match authenticated user",
        )
    if await org_service.is_active_member(session, user.id, invitation.organization_id):
        raise HTTPException(status_code=409, detail="Already an active member")

    membership = await org_service.upsert_membership(
        session,
        user.id,
        invitation.organization_id,
        is_active=True,
    )
    invitation.status = InvitationStatus.accepted
    invitation.updated_at = utc_now()
    session.add(invitation)
    await session.commit()
    await session.refresh(membership)
    return MemberPublic.model_validate(membership)


async def accept_seller_link_request(
    session: AsyncSession,
    invitation_id: UUID,
    provider_organization_id: UUID,
) -> MemberPublic:
    await _require_provider_org(session, provider_organization_id)
    invitation = await get_entity(
        session, OrganizationInvitation, id=invitation_id, required=False
    )
    if invitation is None or invitation.organization_id != provider_organization_id:
        raise HTTPException(status_code=404, detail="Not found")
    if invitation.kind != InvitationKind.seller_link_request:
        raise HTTPException(status_code=400, detail="Invalid invitation type")
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="Invitation is not pending")
    if invitation.counterparty_organization_id is None or invitation.user_id is None:
        raise HTTPException(status_code=400, detail="Invalid seller link request")

    seller_org_id = invitation.counterparty_organization_id
    await link_service.link_provider_to_seller(
        session,
        provider_organization_id,
        seller_org_id,
    )
    membership = await get_entity(
        session,
        UserOrganization,
        user_id=invitation.user_id,
        organization_id=seller_org_id,
        required=False,
    )
    if membership is None:
        raise HTTPException(status_code=400, detail="Invalid seller link request")

    invitation.status = InvitationStatus.accepted
    invitation.updated_at = utc_now()
    session.add(invitation)
    await session.commit()
    await session.refresh(membership)
    return MemberPublic.model_validate(membership)


async def reject_seller_link_request(
    session: AsyncSession,
    invitation_id: UUID,
    provider_organization_id: UUID,
) -> InvitationPublic:
    await _require_provider_org(session, provider_organization_id)
    invitation = await get_entity(
        session, OrganizationInvitation, id=invitation_id, required=False
    )
    if invitation is None or invitation.organization_id != provider_organization_id:
        raise HTTPException(status_code=404, detail="Not found")
    if invitation.kind != InvitationKind.seller_link_request:
        raise HTTPException(status_code=400, detail="Invalid invitation type")
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="Invitation is not pending")

    invitation.status = InvitationStatus.rejected
    invitation.updated_at = utc_now()
    session.add(invitation)
    await session.commit()
    await session.refresh(invitation)
    return InvitationPublic.model_validate(invitation)


async def cancel_invite(
    session: AsyncSession,
    invitation_id: UUID,
    organization_id: UUID,
) -> None:
    invitation = await get_entity(
        session, OrganizationInvitation, id=invitation_id, required=False
    )
    if invitation is None or invitation.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="Not found")
    if invitation.kind != InvitationKind.member_invite:
        raise HTTPException(status_code=400, detail="Invalid invitation type")
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="Invitation is not pending")

    invitation.status = InvitationStatus.cancelled
    invitation.updated_at = utc_now()
    session.add(invitation)
    await session.commit()


async def list_pending_for_organization(
    session: AsyncSession,
    organization_id: UUID,
) -> list[InvitationPublic]:
    result = await session.execute(
        select(OrganizationInvitation)
        .where(
            OrganizationInvitation.organization_id == organization_id,
            OrganizationInvitation.status == InvitationStatus.pending,
        )
        .order_by(OrganizationInvitation.created_at.desc())
    )
    return [InvitationPublic.model_validate(r) for r in result.scalars().all()]


async def list_my_pending_seller_link_requests(
    session: AsyncSession,
    user_id: UUID,
) -> list[InvitationPublic]:
    seller_org_ids = await link_service.list_seller_org_ids_for_user(session, user_id)
    if not seller_org_ids:
        return []
    result = await session.execute(
        select(OrganizationInvitation)
        .where(
            OrganizationInvitation.counterparty_organization_id.in_(seller_org_ids),
            OrganizationInvitation.kind == InvitationKind.seller_link_request,
            OrganizationInvitation.status == InvitationStatus.pending,
        )
        .order_by(OrganizationInvitation.created_at.desc())
    )
    return [InvitationPublic.model_validate(r) for r in result.scalars().all()]
