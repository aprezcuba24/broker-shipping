from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.security.passwords import hash_password, verify_password
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User
from app.schemas.auth import UserLogin, UserRegister


def _normalize_email(email: str) -> str:
    return email.strip().lower()


async def register_user(session: AsyncSession, data: UserRegister) -> User:
    email = _normalize_email(str(data.email))
    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, data: UserLogin) -> User | None:
    email = _normalize_email(str(data.email))
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        return None
    if not verify_password(data.password, user.password_hash):
        return None
    return user


async def list_user_organizations(
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
