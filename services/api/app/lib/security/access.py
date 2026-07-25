"""Auth helpers without FastAPI ``Depends`` (membership, org type)."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.user.api_key import ApiKey
from app.models.user.user import User


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


async def ensure_organization_access(
    session: AsyncSession,
    user: User,
    *,
    organization_id: UUID,
    required_org_type: OrganizationType | None = None,
) -> Organization:
    membership = await session.execute(
        select(UserOrganization).where(
            UserOrganization.user_id == user.id,
            UserOrganization.organization_id == organization_id,
            UserOrganization.is_active.is_(True),
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await session.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    organization = result.scalar_one_or_none()
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    if required_org_type is not None and organization.type != required_org_type:
        raise HTTPException(status_code=403, detail="Forbidden")

    return organization
