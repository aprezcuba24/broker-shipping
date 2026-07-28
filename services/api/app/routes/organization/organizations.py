from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.security.deps import CurrentUserDep, require_organization
from app.models.organization.organization import Organization
from app.schemas.invitation import (
    AcceptByTokenBody,
    InvitationCreatedResponse,
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
    session: Annotated[AsyncSession, Depends(get_db)],
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
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrganizationPublic]:
    orgs = await org_service.list_organizations_for_user(session, user.id)
    return [OrganizationPublic.model_validate(o) for o in orgs]


@router.post("/invitations/accept-by-token", response_model=MemberPublic)
async def accept_invitation_by_token(
    body: AcceptByTokenBody,
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> MemberPublic:
    return await invitation_service.accept_by_token(session, user, body.token)


@router.post(
    "/{organization_id}/member-invitations",
    response_model=InvitationCreatedResponse,
    status_code=201,
)
async def create_member_invitation(
    organization: AnyOrgDep,
    body: MemberInviteCreate,
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationCreatedResponse:
    return await invitation_service.create_member_invite(
        session,
        organization_id=organization.id,
        created_by_user_id=user.id,
        invitee_email=str(body.invitee_email),
    )


@router.delete(
    "/{organization_id}/invitations/{invitation_id}",
    status_code=204,
)
async def cancel_invitation(
    organization: AnyOrgDep,
    invitation_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await invitation_service.cancel_invite(session, invitation_id, organization.id)
    return Response(status_code=204)


@router.get(
    "/{organization_id}/members",
    response_model=list[MemberPublic],
)
async def list_members(
    organization: AnyOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
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
    session: Annotated[AsyncSession, Depends(get_db)],
) -> MemberPublic:
    return await membership_service.set_member_is_active(
        session,
        organization.id,
        user_id,
        is_active=body.is_active,
    )
