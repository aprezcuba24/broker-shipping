"""Seed a demo seller organization linked to the demo provider."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.security.passwords import hash_password
from app.lib.utils import utc_now
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User
from app.services.provider_seller_link import link_provider_to_seller
from scripts.seed.provider_demo import ORG_NAME as PROVIDER_ORG_NAME

NAME = "seller_demo"

USER_EMAIL = "seller@example.com"
USER_PASSWORD = "password123"
USER_NAME = "Seller Demo"
ORG_NAME = "Demo Seller"


async def run(session: AsyncSession) -> None:
    result = await session.execute(select(User).where(User.email == USER_EMAIL))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            name=USER_NAME,
            email=USER_EMAIL,
            password_hash=hash_password(USER_PASSWORD),
            is_super_admin=False,
            email_verified_at=utc_now(),
        )
        session.add(user)
        await session.flush()

    result = await session.execute(
        select(Organization).where(
            Organization.name == ORG_NAME,
            Organization.type == OrganizationType.seller,
        )
    )
    org = result.scalar_one_or_none()
    if org is None:
        org = Organization(name=ORG_NAME, type=OrganizationType.seller)
        session.add(org)
        await session.flush()

    result = await session.execute(
        select(UserOrganization).where(
            UserOrganization.user_id == user.id,
            UserOrganization.organization_id == org.id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        session.add(
            UserOrganization(
                user_id=user.id,
                organization_id=org.id,
                is_active=True,
            ),
        )
        await session.flush()

    result = await session.execute(
        select(Organization).where(
            Organization.name == PROVIDER_ORG_NAME,
            Organization.type == OrganizationType.provider,
        )
    )
    provider_org = result.scalar_one_or_none()
    if provider_org is None:
        raise RuntimeError(
            f"[{NAME}] provider org {PROVIDER_ORG_NAME!r} not found; "
            "run provider_demo seed first"
        )

    await link_provider_to_seller(
        session,
        provider_organization_id=provider_org.id,
        seller_organization_id=org.id,
    )

    print(f"  [{NAME}] user={USER_EMAIL} password={USER_PASSWORD}")
    print(f"  [{NAME}] org={ORG_NAME} id={org.id}")
    print(f"  [{NAME}] linked to provider={PROVIDER_ORG_NAME} id={provider_org.id}")
