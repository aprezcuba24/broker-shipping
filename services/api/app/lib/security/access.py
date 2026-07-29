"""Auth helpers without FastAPI ``Depends`` (membership, org type)."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.user.api_key import ApiKey
from app.models.user.user import User


def is_super_admin(user: User) -> bool:
    return bool(user.is_super_admin)


async def load_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def load_active_api_key_by_prefix(
    session: AsyncSession,
    prefix: str,
) -> ApiKey | None:
    result = await session.execute(
        select(ApiKey).where(
            ApiKey.prefix == prefix,
            col(ApiKey.revoked_at).is_(None),
        )
    )
    return result.scalar_one_or_none()


async def list_all_provider_organization_ids(
    session: AsyncSession,
) -> list[UUID]:
    result = await session.execute(
        select(Organization.id)
        .where(Organization.type == OrganizationType.provider)
        .order_by(Organization.name)
    )
    return list(result.scalars().all())


async def ensure_organization_access(
    session: AsyncSession,
    user: User,
    *,
    organization_id: UUID,
    required_org_type: OrganizationType | None = None,
) -> Organization:
    if is_super_admin(user):
        organization = await get_entity(session, Organization, id=organization_id)
        if required_org_type is not None and organization.type != required_org_type:
            raise HTTPException(status_code=403, detail="Forbidden")
        return organization

    membership = await session.execute(
        select(UserOrganization).where(
            UserOrganization.user_id == user.id,
            UserOrganization.organization_id == organization_id,
            UserOrganization.is_active.is_(True),
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Forbidden")

    organization = await get_entity(session, Organization, id=organization_id)

    if required_org_type is not None and organization.type != required_org_type:
        raise HTTPException(status_code=403, detail="Forbidden")

    return organization
