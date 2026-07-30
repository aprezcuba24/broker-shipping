from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.security.access import is_super_admin
from app.models.product.tag import Tag
from app.models.user.user import User
from app.schemas.pagination import PageResult, PaginationParams
from app.services import provider_seller_link as link_service


async def list_accessible_tags(
    session: AsyncSession,
    user: User,
    *,
    pagination: PaginationParams,
    seller_organization_id: UUID | None = None,
    name: str | None = None,
    provider_id: UUID | None = None,
) -> PageResult[Tag]:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user,
        seller_organization_id,
    )
    if provider_id is not None:
        if not is_super_admin(user) and provider_id not in provider_ids:
            raise HTTPException(status_code=403, detail="Forbidden")
        provider_ids = [provider_id]
    if not provider_ids:
        return PageResult(items=[], total=0)

    stmt = (
        select(Tag)
        .where(col(Tag.organization_id).in_(provider_ids))
        .where(Tag.is_active.is_(True))
    )
    if name:
        stmt = stmt.where(col(Tag.name).ilike(f"%{name}%"))
    stmt = stmt.order_by(Tag.name)
    return await paginate(session, stmt, pagination)


async def get_accessible_tag(
    session: AsyncSession,
    tag_id: UUID,
    user: User,
    *,
    seller_organization_id: UUID | None = None,
) -> Tag:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user,
        seller_organization_id,
    )
    if not provider_ids:
        raise HTTPException(status_code=404, detail="Not found")

    tag = await get_entity(session, Tag, id=tag_id, required=False)
    if (
        tag is None
        or tag.organization_id not in provider_ids
        or not tag.is_active
    ):
        raise HTTPException(status_code=404, detail="Not found")
    return tag
