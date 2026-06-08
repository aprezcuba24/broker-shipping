"""Wipe domain tables and seed base users and organizations."""

from __future__ import annotations

import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from app.config import settings  # noqa: E402
from app.db.session import create_async_engine_and_session_maker  # noqa: E402
from app.lib.security.passwords import hash_password  # noqa: E402
from app.modules.organization.models import (  # noqa: E402
    Organization,
    OrganizationType,
    ProviderSellerLink,
    UserOrganization,
)
from app.modules.user.models import User  # noqa: E402

ORG_ALPHA = "Organización Alpha"
ORG_BETA = "Organización Beta"
SELLER_ALPHA = "Tienda Alpha"
SELLER_BETA = "Tienda Beta"


@dataclass(frozen=True)
class UserSeed:
    username: str
    password: str
    is_super_admin: bool
    provider_organization_names: tuple[str, ...] = ()
    seller_organization_names: tuple[str, ...] = ()


USERS: tuple[UserSeed, ...] = (
    UserSeed("superadmin", "SuperAdmin123!", is_super_admin=True),
    UserSeed(
        "org-both",
        "User123!",
        is_super_admin=False,
        provider_organization_names=(ORG_ALPHA, ORG_BETA),
    ),
    UserSeed(
        "org-one",
        "User123!",
        is_super_admin=False,
        provider_organization_names=(ORG_ALPHA,),
    ),
    UserSeed(
        "seller-both",
        "User123!",
        is_super_admin=False,
        seller_organization_names=(SELLER_ALPHA, SELLER_BETA),
    ),
    UserSeed(
        "seller-one",
        "User123!",
        is_super_admin=False,
        seller_organization_names=(SELLER_ALPHA,),
    ),
    UserSeed("standalone-one", "User123!", is_super_admin=False),
    UserSeed("standalone-two", "User123!", is_super_admin=False),
)

PROVIDER_ORGANIZATION_NAMES: tuple[str, ...] = (ORG_ALPHA, ORG_BETA)
SELLER_ORGANIZATION_NAMES: tuple[str, ...] = (SELLER_ALPHA, SELLER_BETA)


async def _clean_database(session: AsyncSession) -> None:
    await session.execute(
        text(
            "TRUNCATE TABLE api_key, organization_invitation, provider_seller_link, "
            "user_organization, \"user\", category, product, organization "
            "RESTART IDENTITY CASCADE",
        ),
    )


async def _create_organizations(session: AsyncSession) -> dict[str, UUID]:
    org_ids: dict[str, UUID] = {}
    for name in PROVIDER_ORGANIZATION_NAMES:
        org = Organization(name=name, type=OrganizationType.provider)
        session.add(org)
        await session.flush()
        org_ids[name] = org.id
        print(f"  provider organization created: {name}")

    for name in SELLER_ORGANIZATION_NAMES:
        org = Organization(name=name, type=OrganizationType.seller)
        session.add(org)
        await session.flush()
        org_ids[name] = org.id
        print(f"  seller organization created: {name}")

    session.add(
        ProviderSellerLink(
            provider_organization_id=org_ids[ORG_ALPHA],
            seller_organization_id=org_ids[SELLER_ALPHA],
            is_active=True,
        ),
    )
    session.add(
        ProviderSellerLink(
            provider_organization_id=org_ids[ORG_BETA],
            seller_organization_id=org_ids[SELLER_BETA],
            is_active=True,
        ),
    )
    print("  provider-seller links: Alpha<->Tienda Alpha, Beta<->Tienda Beta")
    return org_ids


async def _create_user(
    session: AsyncSession,
    seed: UserSeed,
    org_ids: dict[str, UUID],
) -> None:
    user = User(
        username=seed.username,
        password_hash=hash_password(seed.password),
        is_super_admin=seed.is_super_admin,
    )
    session.add(user)
    await session.flush()
    print(f"  user created: {seed.username} (is_super_admin={seed.is_super_admin})")

    for org_name in seed.provider_organization_names:
        session.add(
            UserOrganization(
                user_id=user.id,
                organization_id=org_ids[org_name],
                is_active=True,
            ),
        )
        print(f"    membership (provider): {seed.username} -> {org_name}")

    for org_name in seed.seller_organization_names:
        session.add(
            UserOrganization(
                user_id=user.id,
                organization_id=org_ids[org_name],
                is_active=True,
            ),
        )
        print(f"    membership (seller): {seed.username} -> {org_name}")


async def run_seed() -> None:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            print("Cleaning database...")
            await _clean_database(session)

            print("Seeding organizations...")
            org_ids = await _create_organizations(session)

            print("Seeding users...")
            for seed in USERS:
                await _create_user(session, seed, org_ids)

            await session.commit()
        print("Seed completed.")
    finally:
        await engine.dispose()


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
