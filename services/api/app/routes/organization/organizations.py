from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response

from app.deps import SessionDep
from app.lib.security.deps import CurrentUserDep, require_organization
from app.models.organization.organization import Organization
from app.schemas.invitation import (
    AcceptByTokenBody,
    InvitationCreatedResponse,
    InvitationPublic,
    MemberInviteCreate,
    MemberIsActivePatch,
    MemberPublic,
)
from app.schemas.organization import OrganizationCreate, OrganizationPublic
from app.services import invitation as invitation_service
from app.services import membership as membership_service
from app.services import organization as org_service

router = APIRouter(prefix="/organizations", tags=["organizations"])

AnyOrgDep = Annotated[Organization, Depends(require_organization())]


@router.post("/", response_model=OrganizationPublic, status_code=201)
async def create_organization(
    body: OrganizationCreate,
    user: CurrentUserDep,
    session: SessionDep,
) -> OrganizationPublic:
    org = await org_service.create_organization_for_user(
        session,
        user_id=user.id,
        name=body.name,
        org_type=body.type,
    )
    return OrganizationPublic.model_validate(org)


@router.get("/", response_model=list[OrganizationPublic])
async def list_organizations(
    user: CurrentUserDep,
    session: SessionDep,
) -> list[OrganizationPublic]:
    orgs = await org_service.list_organizations_for_user(session, user.id)
    return [OrganizationPublic.model_validate(o) for o in orgs]


@router.post("/invitations/accept-by-token", response_model=MemberPublic)
async def accept_invitation_by_token(
    body: AcceptByTokenBody,
    user: CurrentUserDep,
    session: SessionDep,
) -> MemberPublic:
    return await invitation_service.accept_by_token(session, user, body.token)


@router.get(
    "/{organization_id}/member-invitations",
    response_model=list[InvitationPublic],
)
async def list_member_invitations(
    organization: AnyOrgDep,
    session: SessionDep,
) -> list[InvitationPublic]:
    return await invitation_service.list_pending_member_invites(
        session, organization.id
    )


@router.post(
    "/{organization_id}/member-invitations",
    response_model=InvitationCreatedResponse,
    status_code=201,
)
async def create_member_invitation(
    organization: AnyOrgDep,
    body: MemberInviteCreate,
    user: CurrentUserDep,
    session: SessionDep,
) -> InvitationCreatedResponse:
    return await invitation_service.create_member_invite(
        session,
        organization_id=organization.id,
        created_by_user_id=user.id,
        invitee_email=body.invitee_email,
    )


@router.delete(
    "/{organization_id}/invitations/{invitation_id}",
    status_code=204,
)
async def cancel_invitation(
    organization: AnyOrgDep,
    invitation_id: UUID,
    session: SessionDep,
) -> Response:
    await invitation_service.cancel_invite(session, invitation_id, organization.id)
    return Response(status_code=204)


@router.get(
    "/{organization_id}/members",
    response_model=list[MemberPublic],
)
async def list_members(
    organization: AnyOrgDep,
    session: SessionDep,
) -> list[MemberPublic]:
    return await membership_service.list_members(session, organization.id)


@router.patch(
    "/{organization_id}/members/{user_id}",
    response_model=MemberPublic,
)
async def patch_member(
    organization: AnyOrgDep,
    user_id: UUID,
    body: MemberIsActivePatch,
    session: SessionDep,
) -> MemberPublic:
    return await membership_service.set_member_is_active(
        session,
        organization.id,
        user_id,
        is_active=body.is_active,
    )
