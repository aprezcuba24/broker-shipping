from __future__ import annotations

from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.config import settings
from app.events.types import EmailVerificationRequestedEvent
from app.lib.events import emit
from app.lib.security.access import is_super_admin, load_user_by_id
from app.lib.security.api_keys import hash_secret
from app.lib.security.email_verification import generate_verification_token
from app.lib.security.passwords import hash_password, verify_password
from app.lib.utils import utc_now
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User
from app.schemas.auth import UserLogin, UserRegister
from app.types import ClientApp

EMAIL_NOT_VERIFIED_DETAIL = "Email not verified"
_RESEND_OK_MESSAGE = (
    "If an account exists for that email and is not verified, "
    "a new confirmation link has been sent."
)


def _verification_url(client_app: ClientApp, raw_token: str) -> str:
    return f"{settings.frontend_base_url(client_app)}/verify-email?token={raw_token}"


def _set_verification_token(user: User) -> str:
    raw, token_hash = generate_verification_token()
    user.email_verification_token_hash = token_hash
    user.email_verification_expires_at = utc_now() + timedelta(
        hours=settings.email_verification_token_hours
    )
    return raw


async def register_user(session: AsyncSession, data: UserRegister) -> User:
    existing = await session.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    raw_token = _set_verification_token(user)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    await emit(
        EmailVerificationRequestedEvent(
            user_id=user.id,
            email=user.email,
            name=user.name,
            verify_url=_verification_url(data.client_app, raw_token),
        ),
        background=True,
    )
    return user


async def authenticate_user(session: AsyncSession, data: UserLogin) -> User:
    result = await session.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.email_verified_at is None:
        raise HTTPException(status_code=403, detail=EMAIL_NOT_VERIFIED_DETAIL)
    return user


async def verify_email(session: AsyncSession, token: str) -> User:
    token_hash = hash_secret(token)
    result = await session.execute(
        select(User).where(User.email_verification_token_hash == token_hash)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if user.email_verified_at is not None:
        raise HTTPException(status_code=400, detail="Email already verified")
    if (
        user.email_verification_expires_at is None
        or user.email_verification_expires_at < utc_now()
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.email_verified_at = utc_now()
    user.email_verification_token_hash = None
    user.email_verification_expires_at = None
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def resend_verification_email(
    session: AsyncSession,
    email: str,
    client_app: ClientApp,
) -> str:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or user.email_verified_at is not None:
        return _RESEND_OK_MESSAGE

    raw_token = _set_verification_token(user)
    session.add(user)
    await session.commit()

    await emit(
        EmailVerificationRequestedEvent(
            user_id=user.id,
            email=user.email,
            name=user.name,
            verify_url=_verification_url(client_app, raw_token),
        ),
        background=True,
    )
    return _RESEND_OK_MESSAGE


async def list_user_organizations(
    session: AsyncSession,
    user_id: UUID,
) -> list[Organization]:
    user = await load_user_by_id(session, user_id)
    if user is not None and is_super_admin(user):
        return []

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
