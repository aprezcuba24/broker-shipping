from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Response

from app.lib.security import UserPrincipal, require_user
from app.modules.organization.models import (
    AcceptByTokenBody,
    CreateInviteBody,
    InvitationCreatedResponse,
    InvitationPublic,
    MemberIsActivePatch,
    MemberPublic,
)
from app.modules.organization.security import (
    require_invitation_org_provider,
    require_org_not_active_member,
    require_org_provider,
)
from app.modules.organization.services import InvitationService, MembershipService

router = APIRouter(route_class=DishkaRoute)


@router.get("/invitations/mine", response_model=list[InvitationPublic])
@require_user
async def list_my_invitations(
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    return await invitations.list_my_pending_requests(principal.user_id)


@router.post("/invitations/accept-by-token", response_model=MemberPublic)
@require_user
async def accept_invitation_by_token(
    body: AcceptByTokenBody,
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    return await invitations.accept_by_token(principal.user_id, body.token)


@router.post("/invitations/{invitation_id}/accept", response_model=MemberPublic)
@require_invitation_org_provider
@require_user
async def accept_invitation(
    invitation_id: UUID,
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    return await invitations.accept_seller_request(invitation_id, principal.user_id)


@router.post("/invitations/{invitation_id}/reject", response_model=InvitationPublic)
@require_invitation_org_provider
@require_user
async def reject_invitation(
    invitation_id: UUID,
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    return await invitations.reject_seller_request(invitation_id, principal.user_id)


@router.delete("/invitations/{invitation_id}", status_code=204)
@require_invitation_org_provider
@require_user
async def cancel_invitation(
    invitation_id: UUID,
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    await invitations.cancel_provider_invite(invitation_id, principal.user_id)
    return Response(status_code=204)


@router.get("/{organization_id}/members", response_model=list[MemberPublic])
@require_org_provider
@require_user
async def list_members(
    organization_id: UUID,
    membership: FromDishka[MembershipService],
):
    return await membership.list_members(organization_id)


@router.patch("/{organization_id}/members/{user_id}", response_model=MemberPublic)
@require_org_provider
@require_user
async def patch_member(
    organization_id: UUID,
    user_id: UUID,
    body: MemberIsActivePatch,
    membership: FromDishka[MembershipService],
):
    return await membership.set_member_is_active(
        organization_id,
        user_id,
        is_active=body.is_active,
    )


@router.post(
    "/{organization_id}/invitations",
    response_model=InvitationCreatedResponse,
    status_code=201,
)
@require_org_provider
@require_user
async def create_invitation(
    organization_id: UUID,
    body: CreateInviteBody,
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    return await invitations.create_provider_invite(
        organization_id,
        principal.user_id,
        body.role,
    )


@router.post(
    "/{organization_id}/join-requests",
    response_model=InvitationPublic,
    status_code=201,
)
@require_org_not_active_member
@require_user
async def create_join_request(
    organization_id: UUID,
    invitations: FromDishka[InvitationService],
    principal: UserPrincipal,
):
    return await invitations.create_seller_request(organization_id, principal.user_id)


@router.get("/{organization_id}/invitations", response_model=list[InvitationPublic])
@require_org_provider
@require_user
async def list_organization_invitations(
    organization_id: UUID,
    invitations: FromDishka[InvitationService],
):
    return await invitations.list_pending_for_organization(organization_id)
