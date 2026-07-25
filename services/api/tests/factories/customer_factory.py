from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.models.address import Address
from app.modules.orders.models.customer import Customer


async def create_customer(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    name: str | None = None,
    phone: str | None = None,
    identification: str | None = None,
) -> dict:
    oid = (
        organization_id
        if isinstance(organization_id, UUID)
        else UUID(str(organization_id))
    )
    entity = Customer(
        organization_id=oid,
        name=name or "Factory Customer",
        phone=phone or "+53555111111",
        identification=identification or "ID-0001",
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


async def create_address(
    session: AsyncSession,
    *,
    customer_id: UUID | str,
    is_active: bool = True,
    province: str = "La Habana",
    municipality: str = "Plaza",
    district: str = "Vedado",
    neighborhood: str = "Centro",
    address: str = "Calle 1 #100",
    reference: str | None = "Frente al parque",
) -> dict:
    cid = customer_id if isinstance(customer_id, UUID) else UUID(str(customer_id))
    entity = Address(
        customer_id=cid,
        province=province,
        municipality=municipality,
        district=district,
        neighborhood=neighborhood,
        address=address,
        reference=reference,
        is_active=is_active,
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
        organization_id: UUID | str,
        name: str | None = None,
        phone: str | None = None,
        identification: str | None = None,
    ) -> dict:
        self._n += 1
        return await create_customer(
            self._session,
            organization_id=organization_id,
            name=name or f"Customer {self._n:04d}",
            phone=phone or f"+53555{self._n:06d}",
            identification=identification or f"ID-{self._n:04d}",
        )

    async def build_with_address(
        self,
        *,
        organization_id: UUID | str,
        name: str | None = None,
        phone: str | None = None,
        identification: str | None = None,
        is_active: bool = True,
    ) -> dict:
        customer = await self.build(
            organization_id=organization_id,
            name=name,
            phone=phone,
            identification=identification,
        )
        address = await create_address(
            self._session,
            customer_id=customer["id"],
            is_active=is_active,
        )
        return {"customer": customer, "address": address}
