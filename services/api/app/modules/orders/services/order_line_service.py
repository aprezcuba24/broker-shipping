from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException

from app.lib.persistence import BaseService
from app.modules.orders.models.enums import OrderLineStatus
from app.modules.orders.models.order_line import OrderLine
from app.modules.orders.repositories import OrderLineRepository
from app.modules.products.models import Product


class OrderLineService(BaseService[OrderLine]):
    def __init__(self, repository: OrderLineRepository) -> None:
        super().__init__(repository)

    async def list_for_order(self, order_id: UUID) -> list[OrderLine]:
        return await self._repo.list_by_order_id(order_id)

    async def list_for_orders(self, order_ids: Sequence[UUID]) -> list[OrderLine]:
        return await self._repo.list_by_order_ids(order_ids)

    async def get_for_order(
        self,
        order_id: UUID,
        line_id: UUID,
    ) -> OrderLine | None:
        return await self._repo.get_by_order_and_id(order_id, line_id)

    async def create_for_order(
        self,
        order_id: UUID,
        lines: Sequence[OrderLine],
    ) -> list[OrderLine]:
        return await self._repo.create_for_order(order_id, lines)

    @staticmethod
    def filter_for_organization(
        lines: list[OrderLine],
        organization_id: UUID,
    ) -> list[OrderLine]:
        return [ln for ln in lines if ln.organization_id == organization_id]

    async def cancel_one(self, line: OrderLine) -> OrderLine:
        if line.status in (OrderLineStatus.shipped, OrderLineStatus.delivered):
            raise HTTPException(
                status_code=409,
                detail="Line cannot be canceled when shipped or delivered",
            )
        return await self._repo.update_status(line, OrderLineStatus.canceled)

    async def cancel_all_if_created(self, order_id: UUID) -> None:
        lines = await self.list_for_order(order_id)
        if not lines:
            raise HTTPException(status_code=409, detail="Order has no lines")
        if not all(line.status == OrderLineStatus.created for line in lines):
            raise HTTPException(
                status_code=409,
                detail="Order can only be canceled when all lines are in created status",
            )
        await self._repo.cancel_all_for_order(order_id, OrderLineStatus.canceled)

    @staticmethod
    def build_from_product(product: Product, quantity: int) -> OrderLine:
        return OrderLine(
            product_id=product.id,
            organization_id=product.organization_id,
            quantity=quantity,
            product_snapshot={
                "product_id": str(product.id),
                "name": product.name,
                "category_id": str(product.category_id),
                "organization_id": str(product.organization_id),
                "price": product.price,
            },
        )
