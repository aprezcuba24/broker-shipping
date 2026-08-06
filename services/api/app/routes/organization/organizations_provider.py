from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response

from app.deps import SessionDep
from app.lib.security.deps import require_organization
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.schemas.invitation import InvitationPublic, MemberIsActivePatch, MemberPublic
from app.schemas.organization import LinkedSellerPublic, OrganizationPublic
from app.services import invitation as invitation_service
from app.services import provider_seller_link as link_service

router = APIRouter(prefix="/organizations/provider", tags=["organizations"])

ProviderMemberOrgDep = Annotated[
    Organization,
    Depends(require_organization(OrganizationType.provider)),
]


@router.get(
    "/{organization_id}/invitations",
    response_model=list[InvitationPublic],
)
async def list_organization_invitations(
    organization: ProviderMemberOrgDep,
    session: SessionDep,
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
    session: SessionDep,
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
    session: SessionDep,
) -> InvitationPublic:
    return await invitation_service.reject_seller_link_request(
        session, invitation_id, organization.id
    )


@router.get(
    "/{organization_id}/linked-sellers",
    response_model=list[LinkedSellerPublic],
)
async def list_linked_sellers(
    organization: ProviderMemberOrgDep,
    session: SessionDep,
) -> list[LinkedSellerPublic]:
    sellers = await link_service.list_linked_sellers(session, organization.id)
    pending_ids = await link_service.seller_ids_with_pending_commissions(
        session,
        organization.id,
        [s.id for s in sellers],
    )
    return [
        LinkedSellerPublic(
            **OrganizationPublic.model_validate(s).model_dump(),
            has_pending_commissions=s.id in pending_ids,
        )
        for s in sellers
    ]


@router.patch(
    "/{organization_id}/linked-sellers/{seller_organization_id}",
    status_code=204,
)
async def patch_seller_link(
    organization: ProviderMemberOrgDep,
    seller_organization_id: UUID,
    body: MemberIsActivePatch,
    session: SessionDep,
) -> Response:
    await link_service.set_link_active(
        session,
        organization.id,
        seller_organization_id,
        is_active=body.is_active,
    )
    return Response(status_code=204)
