from uuid import UUID

from fastapi import APIRouter, Response

from app.deps import SessionDep
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.models.product.tag import Tag
from app.schemas.pagination import Page
from app.schemas.tag import TagCreate, TagPublic, TagUpdate
from app.services import tag as tag_service

router = APIRouter(prefix="/tags/provider", tags=["tags"])


@router.get("/", response_model=Page[TagPublic])
async def list_tags(
    organization: ProviderOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    is_active: bool | None = None,
) -> Page[TagPublic]:
    result = await tag_service.list_tags_for_organization(
        session,
        organization.id,
        pagination=pagination,
        name=name,
        is_active=is_active,
    )
    return Page.from_mapped(result, pagination, TagPublic.model_validate)


@router.get("/{tag_id}", response_model=TagPublic)
async def get_tag(
    tag_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> TagPublic:
    tag = await get_entity(
        session,
        Tag,
        id=tag_id,
        organization_id=organization.id,
    )
    return TagPublic.model_validate(tag)


@router.post("/", response_model=TagPublic, status_code=201)
async def create_tag(
    body: TagCreate,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> TagPublic:
    tag = await tag_service.create_tag(session, organization.id, body)
    return TagPublic.model_validate(tag)


@router.patch("/{tag_id}", response_model=TagPublic)
async def patch_tag(
    tag_id: UUID,
    body: TagUpdate,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> TagPublic:
    tag = await tag_service.update_tag(
        session,
        tag_id,
        organization.id,
        body,
    )
    return TagPublic.model_validate(tag)


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> Response:
    await tag_service.delete_tag(session, tag_id, organization.id)
    return Response(status_code=204)
