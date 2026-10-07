from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.lib.persistence.apply_update import apply_partial_update
from app.lib.persistence.pagination import paginate
from app.models.facebook.facebook_group import FacebookGroup
from app.schemas.facebook_group import FacebookGroupCreate, FacebookGroupUpdate
from app.schemas.pagination import PageResult, PaginationParams


async def list_facebook_groups_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
) -> PageResult[FacebookGroup]:
    stmt = select(FacebookGroup).where(
        FacebookGroup.organization_id == organization_id,
    )
    if name:
        term = name.strip()
        if term:
            stmt = stmt.where(col(FacebookGroup.name).ilike(f"%{term}%"))
    stmt = stmt.order_by(FacebookGroup.name)
    return await paginate(session, stmt, pagination)


async def create_facebook_group(
    session: AsyncSession,
    organization_id: UUID,
    data: FacebookGroupCreate,
) -> FacebookGroup:
    group = FacebookGroup(
        name=data.name,
        facebook_id=data.facebook_id,
        organization_id=organization_id,
    )
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group


async def update_facebook_group(
    session: AsyncSession,
    group_id: UUID,
    organization_id: UUID,
    data: FacebookGroupUpdate,
) -> FacebookGroup:
    group = await get_entity(
        session,
        FacebookGroup,
        id=group_id,
        organization_id=organization_id,
    )
    apply_partial_update(group, data)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group


async def delete_facebook_group(
    session: AsyncSession,
    group_id: UUID,
    organization_id: UUID,
) -> None:
    group = await get_entity(
        session,
        FacebookGroup,
        id=group_id,
        organization_id=organization_id,
    )
    await session.delete(group)
    await session.commit()
