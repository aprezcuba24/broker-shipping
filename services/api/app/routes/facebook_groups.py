from uuid import UUID

from fastapi import APIRouter, Response

from app.deps import SessionDep
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import SellerOrgDep
from app.models.facebook.facebook_group import FacebookGroup
from app.schemas.facebook_group import (
    FacebookGroupCreate,
    FacebookGroupPublic,
    FacebookGroupUpdate,
)
from app.schemas.pagination import Page
from app.services import facebook_group as facebook_group_service

router = APIRouter(prefix="/facebook/groups", tags=["facebook"])


@router.get("/", response_model=Page[FacebookGroupPublic])
async def list_facebook_groups(
    organization: SellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
) -> Page[FacebookGroupPublic]:
    result = await facebook_group_service.list_facebook_groups_for_organization(
        session,
        organization.id,
        pagination=pagination,
        name=name,
    )
    return Page.from_mapped(result, pagination, FacebookGroupPublic.model_validate)


@router.get("/{group_id}", response_model=FacebookGroupPublic)
async def get_facebook_group(
    group_id: UUID,
    organization: SellerOrgDep,
    session: SessionDep,
) -> FacebookGroupPublic:
    group = await get_entity(
        session,
        FacebookGroup,
        id=group_id,
        organization_id=organization.id,
    )
    return FacebookGroupPublic.model_validate(group)


@router.post("/", response_model=FacebookGroupPublic, status_code=201)
async def create_facebook_group(
    body: FacebookGroupCreate,
    organization: SellerOrgDep,
    session: SessionDep,
) -> FacebookGroupPublic:
    group = await facebook_group_service.create_facebook_group(
        session,
        organization.id,
        body,
    )
    return FacebookGroupPublic.model_validate(group)


@router.patch("/{group_id}", response_model=FacebookGroupPublic)
async def patch_facebook_group(
    group_id: UUID,
    body: FacebookGroupUpdate,
    organization: SellerOrgDep,
    session: SessionDep,
) -> FacebookGroupPublic:
    group = await facebook_group_service.update_facebook_group(
        session,
        group_id,
        organization.id,
        body,
    )
    return FacebookGroupPublic.model_validate(group)


@router.delete("/{group_id}", status_code=204)
async def delete_facebook_group(
    group_id: UUID,
    organization: SellerOrgDep,
    session: SessionDep,
) -> Response:
    await facebook_group_service.delete_facebook_group(
        session,
        group_id,
        organization.id,
    )
    return Response(status_code=204)
