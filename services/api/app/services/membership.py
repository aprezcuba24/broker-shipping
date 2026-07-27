from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.organization.user_organization import UserOrganization
from app.schemas.invitation import MemberPublic
from app.services import organization as org_service


async def list_members(
    session: AsyncSession,
    organization_id: UUID,
) -> list[MemberPublic]:
    result = await session.execute(
        select(UserOrganization)
        .where(UserOrganization.organization_id == organization_id)
        .order_by(UserOrganization.joined_at)
    )
    return [MemberPublic.model_validate(row) for row in result.scalars().all()]


async def set_member_is_active(
    session: AsyncSession,
    organization_id: UUID,
    user_id: UUID,
    *,
    is_active: bool,
) -> MemberPublic:
    membership = await org_service.get_membership(session, user_id, organization_id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Member not found")
    membership.is_active = is_active
    session.add(membership)
    await session.commit()
    await session.refresh(membership)
    return MemberPublic.model_validate(membership)
