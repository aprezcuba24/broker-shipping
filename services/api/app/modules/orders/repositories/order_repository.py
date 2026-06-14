from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import exists, select

from app.lib.persistence import FilterSpec, Resource
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine


class OrderRepository(Resource[Order]):
    async def list_for_seller_filtered(
        self,
        seller_organization_id: UUID,
        *,
        filters: BaseModel | None = None,
        filter_spec: FilterSpec[Order] | None = None,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .where(Order.seller_organization_id == seller_organization_id)
            .order_by(Order.created_at.desc())
        )
        if filters is not None and filter_spec is not None:
            stmt = filter_spec.apply(stmt, filters)
            provider_id = getattr(filters, "provider_organization_id", None)
            if provider_id is not None:
                line_exists = (
                    select(OrderLine.id)
                    .where(
                        OrderLine.order_id == Order.id,
                        OrderLine.organization_id == provider_id,
                    )
                    .correlate(Order)
                )
                stmt = stmt.where(exists(line_exists))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_for_provider_filtered(
        self,
        provider_organization_id: UUID,
        *,
        filters: BaseModel | None = None,
        filter_spec: FilterSpec[Order] | None = None,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .join(OrderLine, OrderLine.order_id == Order.id)
            .where(OrderLine.organization_id == provider_organization_id)
            .distinct()
            .order_by(Order.created_at.desc())
        )
        if filters is not None and filter_spec is not None:
            stmt = filter_spec.apply(stmt, filters)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
