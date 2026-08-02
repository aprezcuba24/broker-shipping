"""Ordered seed module registry and runner."""

from __future__ import annotations

from types import ModuleType

from sqlalchemy.ext.asyncio import AsyncSession

from scripts.seed import locations_cuba, provider_demo, seller_demo

SEED_MODULES: list[ModuleType] = [
    locations_cuba,
    provider_demo,
    seller_demo,
]


async def run_all(session: AsyncSession) -> None:
    for module in SEED_MODULES:
        name = getattr(module, "NAME", module.__name__)
        print(f"Seeding {name}...")
        await module.run(session)
    await session.commit()
    print("Seeds complete.")
