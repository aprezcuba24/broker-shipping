from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.persistence import get_entity
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User
from app.schemas.invitation import MemberPublic


def to_member_public(membership: UserOrganization, user: User) -> MemberPublic:
    return MemberPublic(
        user_id=membership.user_id,
        organization_id=membership.organization_id,
        name=user.name,
        email=user.email,
        is_active=membership.is_active,
        joined_at=membership.joined_at,
    )


async def list_members(
    session: AsyncSession,
    organization_id: UUID,
) -> list[MemberPublic]:
    result = await session.execute(
        select(UserOrganization, User)
        .join(User, User.id == UserOrganization.user_id)
        .where(UserOrganization.organization_id == organization_id)
        .order_by(UserOrganization.joined_at)
    )
    return [to_member_public(membership, user) for membership, user in result.all()]


async def set_member_is_active(
    session: AsyncSession,
    organization_id: UUID,
    user_id: UUID,
    *,
    is_active: bool,
) -> MemberPublic:
    membership = await get_entity(
        session,
        UserOrganization,
        user_id=user_id,
        organization_id=organization_id,
    )
    membership.is_active = is_active
    session.add(membership)
    await session.commit()
    await session.refresh(membership)
    user = await get_entity(session, User, id=user_id)
    return to_member_public(membership, user)
