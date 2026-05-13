from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Product


async def create_product(session: AsyncSession, *, name: str | None = None) -> dict:
    """Insert a Product row and commit so other connections (e.g. HTTP client) see it."""
    entity = Product(name=name if name is not None else "Factory product")
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class ProductFactory:
    """Build persisted Product rows via the database session (no HTTP)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(self, *, name: str | None = None) -> dict:
        self._n += 1
        final_name = name or f"SKU-{self._n:04d}"
        return await create_product(self._session, name=final_name)
