"""Persist seed data into the development database."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import create_async_engine_and_session_maker
from app.lib.security.passwords import hash_password
from app.modules.organization.models import (
    Organization,
    OrganizationType,
    ProviderSellerLink,
    UserOrganization,
)
from app.modules.products.models import Category, Product
from app.modules.user.models import User

from seeds.base_data import (
    CATEGORIES,
    PRODUCTS,
    PROVIDER_ORGANIZATION_NAMES,
    PROVIDER_SELLER_LINKS,
    SELLER_ORGANIZATION_NAMES,
    USERS,
    ProductSeed,
    UserSeed,
)


async def _clean_database(session: AsyncSession) -> None:
    await session.execute(
        text(
            "TRUNCATE TABLE api_key, organization_invitation, provider_seller_link, "
            'user_organization, "user", category, product, organization '
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

    for link in PROVIDER_SELLER_LINKS:
        session.add(
            ProviderSellerLink(
                provider_organization_id=org_ids[link.provider_name],
                seller_organization_id=org_ids[link.seller_name],
                is_active=True,
            ),
        )
        print(f"  provider-seller link: {link.provider_name} <-> {link.seller_name}")

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


async def _create_users(session: AsyncSession, org_ids: dict[str, UUID]) -> None:
    for seed in USERS:
        await _create_user(session, seed, org_ids)


async def _create_categories(
    session: AsyncSession,
    org_ids: dict[str, UUID],
) -> dict[tuple[str, str], UUID]:
    category_ids: dict[tuple[str, str], UUID] = {}
    for seed in CATEGORIES:
        category = Category(
            name=seed.name,
            organization_id=org_ids[seed.provider_organization_name],
        )
        session.add(category)
        await session.flush()
        category_ids[(seed.provider_organization_name, seed.name)] = category.id
        print(
            f"  category created: {seed.name} "
            f"(provider={seed.provider_organization_name})",
        )
    return category_ids


async def _create_products(
    session: AsyncSession,
    org_ids: dict[str, UUID],
    category_ids: dict[tuple[str, str], UUID],
) -> None:
    for seed in PRODUCTS:
        await _create_product(session, seed, org_ids, category_ids)


async def _create_product(
    session: AsyncSession,
    seed: ProductSeed,
    org_ids: dict[str, UUID],
    category_ids: dict[tuple[str, str], UUID],
) -> None:
    category_id = category_ids[(seed.provider_organization_name, seed.category_name)]
    product = Product(
        name=seed.name,
        organization_id=org_ids[seed.provider_organization_name],
        category_id=category_id,
        price=seed.price,
    )
    session.add(product)
    await session.flush()
    print(
        f"  product created: {seed.name} "
        f"(provider={seed.provider_organization_name}, price={seed.price})",
    )


async def run_seed() -> None:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            print("Cleaning database...")
            await _clean_database(session)

            print("Seeding organizations...")
            org_ids = await _create_organizations(session)

            print("Seeding users...")
            await _create_users(session, org_ids)

            print("Seeding categories...")
            category_ids = await _create_categories(session, org_ids)

            print("Seeding products...")
            await _create_products(session, org_ids, category_ids)

            await session.commit()
        print("Seed completed.")
    finally:
        await engine.dispose()
