from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product.product import Product


async def create_product(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    name: str | None = None,
) -> dict:
    oid = (
        organization_id
        if isinstance(organization_id, UUID)
        else UUID(str(organization_id))
    )
    entity = Product(
        name=name if name is not None else "Factory product",
        organization_id=oid,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class ProductFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        organization_id: UUID | str,
        name: str | None = None,
    ) -> dict:
        self._n += 1
        final_name = name or f"SKU-{self._n:04d}"
        return await create_product(
            self._session,
            organization_id=organization_id,
            name=final_name,
        )
