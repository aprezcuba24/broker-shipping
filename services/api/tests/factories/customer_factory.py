from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer.customer import Customer


async def create_customer(
    session: AsyncSession,
    *,
    seller_organization_id: UUID | str,
    name: str | None = None,
    ci: str | None = None,
    phone: str | None = None,
) -> dict:
    oid = (
        seller_organization_id
        if isinstance(seller_organization_id, UUID)
        else UUID(str(seller_organization_id))
    )
    entity = Customer(
        name=name if name is not None else "Factory customer",
        ci=ci if ci is not None else "CI000000",
        phone=phone if phone is not None else "50000000",
        seller_organization_id=oid,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class CustomerFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        seller_organization_id: UUID | str,
        name: str | None = None,
        ci: str | None = None,
        phone: str | None = None,
    ) -> dict:
        self._n += 1
        return await create_customer(
            self._session,
            seller_organization_id=seller_organization_id,
            name=name or f"Customer-{self._n:04d}",
            ci=ci or f"CI{self._n:06d}",
            phone=phone or f"5{self._n:07d}",
        )
