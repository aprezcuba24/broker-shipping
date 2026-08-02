from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from app.deps import SessionDep
from app.lib.security.deps import CurrentUserDep, SellerOrgDep
from app.schemas.invitation import InvitationPublic
from app.schemas.organization import OrganizationPublic
from app.services import invitation as invitation_service
from app.services import provider_seller_link as link_service

router = APIRouter(prefix="/organizations/seller", tags=["organizations"])


@router.get("/seller-link-requests/mine", response_model=list[InvitationPublic])
async def list_my_seller_link_requests(
    user: CurrentUserDep,
    session: SessionDep,
) -> list[InvitationPublic]:
    return await invitation_service.list_my_pending_seller_link_requests(
        session, user.id
    )


@router.post(
    "/{organization_id}/seller-link-requests",
    response_model=InvitationPublic,
    status_code=201,
)
async def create_seller_link_request(
    organization_id: UUID,
    user: CurrentUserDep,
    session: SessionDep,
    seller_organization_id: Annotated[UUID, Query()],
) -> InvitationPublic:
    return await invitation_service.create_seller_link_request(
        session,
        provider_organization_id=organization_id,
        seller_organization_id=seller_organization_id,
        user_id=user.id,
    )


@router.get("/providers", response_model=list[OrganizationPublic])
async def list_providers(
    organization: SellerOrgDep,
    session: SessionDep,
) -> list[OrganizationPublic]:
    providers = await link_service.list_linked_provider_organizations(
        session,
        organization.id,
    )
    return [OrganizationPublic.model_validate(org) for org in providers]
