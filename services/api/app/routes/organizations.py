from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.security.deps import CurrentUserDep, require_organization
from app.models.organization.enums import OrganizationType
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
from app.services import provider_seller_link as link_service

router = APIRouter(prefix="/organizations", tags=["organizations"])

AnyOrgDep = Annotated[Organization, Depends(require_organization())]
ProviderMemberOrgDep = Annotated[
    Organization,
    Depends(require_organization(OrganizationType.provider)),
]


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


@router.get("/seller-link-requests/mine", response_model=list[InvitationPublic])
async def list_my_seller_link_requests(
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[InvitationPublic]:
    return await invitation_service.list_my_pending_seller_link_requests(
        session, user.id
    )


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


@router.post(
    "/{organization_id}/seller-link-requests",
    response_model=InvitationPublic,
    status_code=201,
)
async def create_seller_link_request(
    organization_id: UUID,
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_db)],
    seller_organization_id: Annotated[UUID, Query()],
) -> InvitationPublic:
    return await invitation_service.create_seller_link_request(
        session,
        provider_organization_id=organization_id,
        seller_organization_id=seller_organization_id,
        user_id=user.id,
    )


@router.get(
    "/{organization_id}/invitations",
    response_model=list[InvitationPublic],
)
async def list_organization_invitations(
    organization: ProviderMemberOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[InvitationPublic]:
    return await invitation_service.list_pending_for_organization(
        session, organization.id
    )


@router.post(
    "/{organization_id}/invitations/{invitation_id}/accept",
    response_model=MemberPublic,
)
async def accept_invitation(
    organization: ProviderMemberOrgDep,
    invitation_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> MemberPublic:
    return await invitation_service.accept_seller_link_request(
        session, invitation_id, organization.id
    )


@router.post(
    "/{organization_id}/invitations/{invitation_id}/reject",
    response_model=InvitationPublic,
)
async def reject_invitation(
    organization: ProviderMemberOrgDep,
    invitation_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationPublic:
    return await invitation_service.reject_seller_link_request(
        session, invitation_id, organization.id
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


@router.get(
    "/{organization_id}/linked-sellers",
    response_model=list[OrganizationPublic],
)
async def list_linked_sellers(
    organization: ProviderMemberOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrganizationPublic]:
    sellers = await link_service.list_linked_sellers(session, organization.id)
    return [OrganizationPublic.model_validate(s) for s in sellers]


@router.patch(
    "/{organization_id}/linked-sellers/{seller_organization_id}",
    status_code=204,
)
async def patch_seller_link(
    organization: ProviderMemberOrgDep,
    seller_organization_id: UUID,
    body: MemberIsActivePatch,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await link_service.set_link_active(
        session,
        organization.id,
        seller_organization_id,
        is_active=body.is_active,
    )
    return Response(status_code=204)
