from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Product


async def create_product(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    category_id: UUID | str,
    name: str | None = None,
    price: int = 1000,
) -> dict:
    """Insert a Product row and commit so other connections (e.g. HTTP client) see it."""
    oid = organization_id if isinstance(organization_id, UUID) else UUID(str(organization_id))
    cid = category_id if isinstance(category_id, UUID) else UUID(str(category_id))
    entity = Product(
        name=name if name is not None else "Factory product",
        organization_id=oid,
        category_id=cid,
        price=price,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class ProductFactory:
    """Build persisted Product rows via the database session (no HTTP)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        organization_id: UUID | str,
        category_id: UUID | str,
        name: str | None = None,
        price: int = 1000,
    ) -> dict:
        self._n += 1
        final_name = name or f"SKU-{self._n:04d}"
        return await create_product(
            self._session,
            organization_id=organization_id,
            category_id=category_id,
            name=final_name,
            price=price,
        )
