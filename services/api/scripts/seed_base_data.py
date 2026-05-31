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
from app.modules.organization.models import Organization, UserOrganization  # noqa: E402
from app.modules.organization.models.enums import OrgMemberRole  # noqa: E402
from app.modules.user.models import User  # noqa: E402

ORG_ALPHA = "Organización Alpha"
ORG_BETA = "Organización Beta"


@dataclass(frozen=True)
class UserSeed:
    username: str
    password: str
    is_super_admin: bool
    organization_names: tuple[str, ...] = ()
    member_role: OrgMemberRole = OrgMemberRole.provider


USERS: tuple[UserSeed, ...] = (
    UserSeed("superadmin", "SuperAdmin123!", is_super_admin=True),
    UserSeed("org-both", "User123!", is_super_admin=False, organization_names=(ORG_ALPHA, ORG_BETA)),
    UserSeed("org-one", "User123!", is_super_admin=False, organization_names=(ORG_ALPHA,)),
    UserSeed(
        "seller-both",
        "User123!",
        is_super_admin=False,
        organization_names=(ORG_ALPHA, ORG_BETA),
        member_role=OrgMemberRole.seller,
    ),
    UserSeed(
        "seller-one",
        "User123!",
        is_super_admin=False,
        organization_names=(ORG_ALPHA,),
        member_role=OrgMemberRole.seller,
    ),
    UserSeed("standalone-one", "User123!", is_super_admin=False),
    UserSeed("standalone-two", "User123!", is_super_admin=False),
)

ORGANIZATION_NAMES: tuple[str, ...] = (ORG_ALPHA, ORG_BETA)


async def _clean_database(session: AsyncSession) -> None:
    await session.execute(
        text(
            "TRUNCATE TABLE api_key, organization_invitation, user_organization, "
            '"user", category, product, organization '
            "RESTART IDENTITY CASCADE",
        ),
    )


async def _create_organizations(session: AsyncSession) -> dict[str, UUID]:
    org_ids: dict[str, UUID] = {}
    for name in ORGANIZATION_NAMES:
        org = Organization(name=name)
        session.add(org)
        await session.flush()
        org_ids[name] = org.id
        print(f"  organization created: {name}")
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

    for org_name in seed.organization_names:
        session.add(
            UserOrganization(
                user_id=user.id,
                organization_id=org_ids[org_name],
                role=seed.member_role,
                is_active=True,
            ),
        )
        print(f"    membership: {seed.username} -> {org_name} ({seed.member_role.value})")


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
