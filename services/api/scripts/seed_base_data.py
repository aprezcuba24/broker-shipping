"""Seed base users and organizations (idempotent by username / org name)."""

from __future__ import annotations

import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from app.config import settings  # noqa: E402
from app.db.session import create_async_engine_and_session_maker  # noqa: E402
from app.lib.security.passwords import hash_password  # noqa: E402
from app.modules.organization.models import Organization, UserOrganization  # noqa: E402
from app.modules.user.models import User  # noqa: E402

ORG_ALPHA = "Organización Alpha"
ORG_BETA = "Organización Beta"


@dataclass(frozen=True)
class UserSeed:
    username: str
    password: str
    is_super_admin: bool
    organization_names: tuple[str, ...] = ()


USERS: tuple[UserSeed, ...] = (
    UserSeed("superadmin", "SuperAdmin123!", is_super_admin=True),
    UserSeed("org-both", "User123!", is_super_admin=False, organization_names=(ORG_ALPHA, ORG_BETA)),
    UserSeed("org-one", "User123!", is_super_admin=False, organization_names=(ORG_ALPHA,)),
    UserSeed("standalone-one", "User123!", is_super_admin=False),
    UserSeed("standalone-two", "User123!", is_super_admin=False),
)

ORGANIZATION_NAMES: tuple[str, ...] = (ORG_ALPHA, ORG_BETA)


async def _get_user_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def _get_org_by_name(session: AsyncSession, name: str) -> Organization | None:
    result = await session.execute(select(Organization).where(Organization.name == name))
    return result.scalar_one_or_none()


async def _ensure_organizations(session: AsyncSession) -> dict[str, UUID]:
    org_ids: dict[str, UUID] = {}
    for name in ORGANIZATION_NAMES:
        existing = await _get_org_by_name(session, name)
        if existing is not None:
            org_ids[name] = existing.id
            print(f"  organization exists: {name}")
            continue
        org = Organization(name=name)
        session.add(org)
        await session.flush()
        org_ids[name] = org.id
        print(f"  organization created: {name}")
    return org_ids


async def _ensure_membership(
    session: AsyncSession,
    *,
    user_id: UUID,
    organization_id: UUID,
) -> None:
    result = await session.execute(
        select(UserOrganization).where(
            UserOrganization.user_id == user_id,
            UserOrganization.organization_id == organization_id,
        )
    )
    if result.scalar_one_or_none() is not None:
        return
    from app.modules.organization.models.enums import OrgMemberRole

    session.add(
        UserOrganization(
            user_id=user_id,
            organization_id=organization_id,
            role=OrgMemberRole.provider,
            is_active=True,
        ),
    )


async def _seed_user(
    session: AsyncSession,
    seed: UserSeed,
    org_ids: dict[str, UUID],
) -> None:
    existing = await _get_user_by_username(session, seed.username)
    if existing is not None:
        print(f"  user exists (skipped): {seed.username}")
        user_id = existing.id
    else:
        user = User(
            username=seed.username,
            password_hash=hash_password(seed.password),
            is_super_admin=seed.is_super_admin,
        )
        session.add(user)
        await session.flush()
        user_id = user.id
        print(f"  user created: {seed.username} (is_super_admin={seed.is_super_admin})")

    for org_name in seed.organization_names:
        org_id = org_ids[org_name]
        await _ensure_membership(session, user_id=user_id, organization_id=org_id)
        print(f"    membership: {seed.username} -> {org_name}")


async def run_seed() -> None:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            print("Seeding organizations...")
            org_ids = await _ensure_organizations(session)

            print("Seeding users...")
            for seed in USERS:
                await _seed_user(session, seed, org_ids)

            await session.commit()
        print("Seed completed.")
    finally:
        await engine.dispose()


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
