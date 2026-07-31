from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import CurrentUserDep, SellerOrgDep
from app.schemas.pagination import Page
from app.schemas.tag import TagPublic
from app.services import seller_tag as seller_tag_service

router = APIRouter(prefix="/tags/seller", tags=["tags"])


@router.get("/", response_model=Page[TagPublic])
async def list_tags(
    user: CurrentUserDep,
    organization: SellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    provider_id: UUID | None = None,
) -> Page[TagPublic]:
    result = await seller_tag_service.list_accessible_tags(
        session,
        user,
        pagination=pagination,
        seller_organization_id=organization.id,
        name=name,
        provider_id=provider_id,
    )
    return Page.from_mapped(result, pagination, TagPublic.model_validate)


@router.get("/{tag_id}", response_model=TagPublic)
async def get_tag(
    tag_id: UUID,
    user: CurrentUserDep,
    organization: SellerOrgDep,
    session: SessionDep,
) -> TagPublic:
    tag = await seller_tag_service.get_accessible_tag(
        session,
        tag_id,
        user,
        seller_organization_id=organization.id,
    )
    return TagPublic.model_validate(tag)
