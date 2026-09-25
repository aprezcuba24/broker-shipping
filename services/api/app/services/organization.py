from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.exceptions import raise_api_error
from app.lib.persistence import get_entity
from app.lib.utils import utc_now
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User

async def create_organization_for_user(
    session: AsyncSession,
    *,
    user_id: UUID,
    name: str,
    org_type: OrganizationType,
) -> Organization:
    org = Organization(name=name, type=org_type)
    session.add(org)
    await session.flush()
    session.add(
        UserOrganization(
            user_id=user_id,
            organization_id=org.id,
            is_active=True,
        )
    )
    await session.commit()
    await session.refresh(org)
    return org

async def list_organizations_for_user(
    session: AsyncSession,
    user_id: UUID,
) -> list[Organization]:
    result = await session.execute(
        select(Organization)
        .join(
            UserOrganization,
            UserOrganization.organization_id == Organization.id,
        )
        .where(
            UserOrganization.user_id == user_id,
            UserOrganization.is_active.is_(True),
        )
        .order_by(Organization.name)
    )
    return list(result.scalars().all())

async def is_active_member(
    session: AsyncSession,
    user_id: UUID,
    organization_id: UUID,
) -> bool:
    result = await session.execute(
        select(UserOrganization).where(
            UserOrganization.user_id == user_id,
            UserOrganization.organization_id == organization_id,
            UserOrganization.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None

async def upsert_membership(
    session: AsyncSession,
    user_id: UUID,
    organization_id: UUID,
    *,
    is_active: bool = True,
) -> UserOrganization:
    membership = await get_entity(
        session,
        UserOrganization,
        user_id=user_id,
        organization_id=organization_id,
        required=False,
    )
    if membership is None:
        membership = UserOrganization(
            user_id=user_id,
            organization_id=organization_id,
            is_active=is_active,
        )
        session.add(membership)
    else:
        membership.is_active = is_active
        membership.joined_at = utc_now()
        session.add(membership)
    await session.flush()
    return membership

async def require_seller_org_membership(
    session: AsyncSession,
    user_id: UUID,
    organization_id: UUID,
) -> Organization:
    org = await get_entity(session, Organization, id=organization_id)
    if org.type != OrganizationType.seller:
        raise_api_error("forbidden")
    if not await is_active_member(session, user_id, organization_id):
        raise_api_error("forbidden")
    return org

async def get_invite_provider(
    session: AsyncSession,
    provider_organization_id: UUID,
) -> Organization:
    """Public lookup for seller invite links; only provider orgs are exposed."""
    org = await get_entity(
        session,
        Organization,
        id=provider_organization_id,
        required=False,
    )
    if org is None or org.type != OrganizationType.provider:
        raise_api_error("not_found")
    return org

async def list_active_member_users(
    session: AsyncSession,
    organization_id: UUID,
) -> list[User]:
    result = await session.execute(
        select(User)
        .join(
            UserOrganization,
            UserOrganization.user_id == User.id,
        )
        .where(
            UserOrganization.organization_id == organization_id,
            UserOrganization.is_active.is_(True),
        )
    )
    return list(result.scalars().all())
