from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.lib.persistence.apply_update import apply_partial_update
from app.lib.persistence.pagination import paginate
from app.models.product.tag import Tag
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.tag import TagCreate, TagUpdate


async def list_tags_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    is_active: bool | None = None,
) -> PageResult[Tag]:
    stmt = select(Tag).where(Tag.organization_id == organization_id)
    if name:
        stmt = stmt.where(col(Tag.name).ilike(f"%{name}%"))
    if is_active is not None:
        stmt = stmt.where(Tag.is_active == is_active)
    stmt = stmt.order_by(Tag.name)
    return await paginate(session, stmt, pagination)


async def create_tag(
    session: AsyncSession,
    organization_id: UUID,
    data: TagCreate,
) -> Tag:
    tag = Tag(
        name=data.name,
        is_active=data.is_active,
        organization_id=organization_id,
    )
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return tag


async def update_tag(
    session: AsyncSession,
    tag_id: UUID,
    organization_id: UUID,
    data: TagUpdate,
) -> Tag:
    tag = await get_entity(
        session,
        Tag,
        id=tag_id,
        organization_id=organization_id,
    )
    apply_partial_update(tag, data)
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return tag


async def delete_tag(
    session: AsyncSession,
    tag_id: UUID,
    organization_id: UUID,
) -> None:
    tag = await get_entity(
        session,
        Tag,
        id=tag_id,
        organization_id=organization_id,
    )
    await session.delete(tag)
    await session.commit()
