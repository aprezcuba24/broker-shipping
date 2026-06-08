from uuid import UUID

from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine


class OrderRepository(Resource[Order]):
    async def list_by_seller_organization_id(
        self,
        organization_id: UUID,
    ) -> list[Order]:
        result = await self._session.execute(
            select(Order)
            .where(Order.seller_organization_id == organization_id)
            .order_by(Order.created_at.desc()),
        )
        return list(result.scalars().all())

    async def list_by_provider_organization_id(
        self,
        organization_id: UUID,
    ) -> list[Order]:
        result = await self._session.execute(
            select(Order)
            .join(OrderLine, OrderLine.order_id == Order.id)
            .where(OrderLine.organization_id == organization_id)
            .distinct()
            .order_by(Order.created_at.desc()),
        )
        return list(result.scalars().all())
