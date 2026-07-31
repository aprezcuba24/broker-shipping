from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer.address import Address
from app.models.customer.customer import Customer


async def create_customer(
    session: AsyncSession,
    *,
    seller_organization_id: UUID | str,
    name: str | None = None,
    ci: str | None = None,
    phone: str | None = None,
    address: str | None = None,
    province_id: UUID | str | None = None,
    municipality_id: UUID | str | None = None,
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

    address_payload = None
    if province_id is not None and municipality_id is not None:
        address_entity = Address(
            address=address if address is not None else "Factory street 1",
            customer_id=entity.id,
            province_id=(
                province_id if isinstance(province_id, UUID) else UUID(str(province_id))
            ),
            municipality_id=(
                municipality_id
                if isinstance(municipality_id, UUID)
                else UUID(str(municipality_id))
            ),
        )
        session.add(address_entity)
        await session.flush()
        address_payload = address_entity.model_dump(mode="json")

    await session.commit()
    payload = entity.model_dump(mode="json")
    payload["address"] = address_payload
    return payload


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
        address: str | None = None,
        province_id: UUID | str | None = None,
        municipality_id: UUID | str | None = None,
    ) -> dict:
        self._n += 1
        return await create_customer(
            self._session,
            seller_organization_id=seller_organization_id,
            name=name or f"Customer-{self._n:04d}",
            ci=ci or f"CI{self._n:06d}",
            phone=phone or f"5{self._n:07d}",
            address=address,
            province_id=province_id,
            municipality_id=municipality_id,
        )
