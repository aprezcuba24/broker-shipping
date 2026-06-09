from uuid import UUID

from sqlalchemy import select, update

from app.lib.persistence import Resource
from app.modules.orders.models.address import Address


class AddressRepository(Resource[Address]):
    async def list_for_customer(self, customer_id: UUID) -> list[Address]:
        result = await self._session.execute(
            select(Address)
            .where(Address.customer_id == customer_id)
            .order_by(Address.created_at),
        )
        return list(result.scalars().all())

    async def get_for_customer(
        self,
        address_id: UUID,
        customer_id: UUID,
    ) -> Address | None:
        result = await self._session.execute(
            select(Address).where(
                Address.id == address_id,
                Address.customer_id == customer_id,
            ),
        )
        return result.scalar_one_or_none()

    async def deactivate_all_for_customer(self, customer_id: UUID) -> None:
        await self._session.execute(
            update(Address)
            .where(Address.customer_id == customer_id)
            .values(is_active=False),
        )
