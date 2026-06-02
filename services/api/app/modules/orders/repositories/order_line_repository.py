from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from app.lib.persistence import Resource
from app.lib.utils import utc_now
from app.modules.orders.models.enums import OrderLineStatus
from app.modules.orders.models.order_line import OrderLine


class OrderLineRepository(Resource[OrderLine]):
    async def list_by_order_id(self, order_id: UUID) -> list[OrderLine]:
        result = await self._session.execute(
            select(OrderLine).where(OrderLine.order_id == order_id),
        )
        return list(result.scalars().all())

    async def list_by_order_ids(self, order_ids: Sequence[UUID]) -> list[OrderLine]:
        if not order_ids:
            return []
        result = await self._session.execute(
            select(OrderLine).where(OrderLine.order_id.in_(order_ids)),
        )
        return list(result.scalars().all())

    async def get_by_order_and_id(
        self,
        order_id: UUID,
        line_id: UUID,
    ) -> OrderLine | None:
        result = await self._session.execute(
            select(OrderLine).where(
                OrderLine.order_id == order_id,
                OrderLine.id == line_id,
            ),
        )
        return result.scalar_one_or_none()

    async def create_for_order(
        self,
        order_id: UUID,
        lines: Sequence[OrderLine],
    ) -> list[OrderLine]:
        created: list[OrderLine] = []
        for line in lines:
            line.order_id = order_id
            self._session.add(line)
            created.append(line)
        await self._session.flush()
        return created

    async def update_status(
        self,
        line: OrderLine,
        status: OrderLineStatus,
    ) -> OrderLine:
        line.status = status
        line.updated_at = utc_now()
        await self._session.flush()
        return line

    async def cancel_all_for_order(
        self,
        order_id: UUID,
        status: OrderLineStatus,
    ) -> None:
        lines = await self.list_by_order_id(order_id)
        now = utc_now()
        for line in lines:
            line.status = status
            line.updated_at = now
        await self._session.flush()
