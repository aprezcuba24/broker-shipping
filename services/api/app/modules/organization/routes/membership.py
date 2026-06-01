from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Response

from app.lib.security import require_user
from app.modules.organization.models import (
    AcceptByTokenBody,
    InvitationCreatedResponse,
    InvitationPublic,
    MemberIsActivePatch,
    MemberPublic,
    Organization,
    OrganizationType,
)
from app.modules.organization.services import InvitationService, MembershipService
from app.modules.user.models import User

router = APIRouter(route_class=DishkaRoute)


@router.get("/invitations/mine", response_model=list[InvitationPublic])
@require_user
async def list_my_invitations(
    invitations: FromDishka[InvitationService],
    user: User,
):
    return await invitations.list_my_pending_requests(user.id)


@router.post("/invitations/accept-by-token", response_model=MemberPublic)
@require_user
async def accept_invitation_by_token(
    body: AcceptByTokenBody,
    invitations: FromDishka[InvitationService],
    user: User,
):
    return await invitations.accept_by_token(user, body.token)


@router.post(
    "/{organization_id}/invitations/{invitation_id}/accept",
    response_model=MemberPublic,
)
@require_user(OrganizationType.provider)
async def accept_invitation(
    organization_id: UUID,
    invitation_id: UUID,
    invitations: FromDishka[InvitationService],
):
    return await invitations.accept_seller_join_request(invitation_id, organization_id)


@router.post(
    "/{organization_id}/invitations/{invitation_id}/reject",
    response_model=InvitationPublic,
)
@require_user(OrganizationType.provider)
async def reject_invitation(
    organization_id: UUID,
    invitation_id: UUID,
    invitations: FromDishka[InvitationService],
):
    return await invitations.reject_seller_join_request(invitation_id, organization_id)


@router.delete("/{organization_id}/invitations/{invitation_id}", status_code=204)
@require_user
async def cancel_invitation(
    organization_id: UUID,
    invitation_id: UUID,
    invitations: FromDishka[InvitationService],
):
    await invitations.cancel_invite(invitation_id, organization_id)
    return Response(status_code=204)


@router.get("/{organization_id}/members", response_model=list[MemberPublic])
@require_user
async def list_members(
    organization_id: UUID,
    membership: FromDishka[MembershipService],
):
    return await membership.list_members(organization_id)


@router.patch("/{organization_id}/members/{user_id}", response_model=MemberPublic)
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
    "/{organization_id}/member-invitations",
    response_model=InvitationCreatedResponse,
    status_code=201,
)
@require_user
async def create_member_invitation(
    organization_id: UUID,
    invitations: FromDishka[InvitationService],
    user: User,
):
    return await invitations.create_member_invite(organization_id, user.id)


@router.post(
    "/{organization_id}/seller-invitations",
    response_model=InvitationCreatedResponse,
    status_code=201,
)
@require_user(OrganizationType.provider)
async def create_seller_invitation(
    organization_id: UUID,
    invitations: FromDishka[InvitationService],
    user: User,
):
    return await invitations.create_seller_invite(organization_id, user.id)


@router.post(
    "/{organization_id}/join-requests",
    response_model=InvitationPublic,
    status_code=201,
)
@require_user(check_path_membership=False)
async def create_join_request(
    organization_id: UUID,
    invitations: FromDishka[InvitationService],
    user: User,
):
    return await invitations.create_seller_join_request(organization_id, user.id)


@router.get("/{organization_id}/invitations", response_model=list[InvitationPublic])
@require_user(OrganizationType.provider)
async def list_organization_invitations(
    organization_id: UUID,
    invitations: FromDishka[InvitationService],
):
    return await invitations.list_pending_for_organization(organization_id)


@router.get("/{organization_id}/linked-sellers", response_model=list[Organization])
@require_user(OrganizationType.provider)
async def list_linked_sellers(
    organization_id: UUID,
    membership: FromDishka[MembershipService],
):
    return await membership.list_linked_sellers(organization_id)


@router.patch(
    "/{organization_id}/linked-sellers/{seller_organization_id}",
    status_code=204,
)
@require_user(OrganizationType.provider)
async def patch_seller_link(
    organization_id: UUID,
    seller_organization_id: UUID,
    body: MemberIsActivePatch,
    membership: FromDishka[MembershipService],
):
    await membership.set_seller_link_active(
        organization_id,
        seller_organization_id,
        is_active=body.is_active,
    )
    return Response(status_code=204)
