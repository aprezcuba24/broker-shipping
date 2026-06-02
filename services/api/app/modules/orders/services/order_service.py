from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from fastapi import HTTPException

from app.lib.persistence import BaseService
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine
from app.modules.orders.repositories import OrderRepository
from app.modules.orders.schemas import OrderCreate, OrderDetail, build_order_detail
from app.modules.orders.services.order_line_service import OrderLineService
from app.modules.organization.models import Organization, OrganizationType
from app.modules.products.services import ProductService
from app.modules.user.services import UserService


class OrderService(BaseService[Order]):
    def __init__(
        self,
        repository: OrderRepository,
        line_service: OrderLineService,
        product_service: ProductService,
        user_service: UserService,
    ) -> None:
        super().__init__(repository)
        self._line_service = line_service
        self._product_service = product_service
        self._user_service = user_service

    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Order.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Order.model_fields.keys()) - Order.IMMUTABLE_FIELDS

    def _visible_lines(
        self,
        order: Order,
        all_lines: list[OrderLine],
        organization: Organization,
    ) -> list[OrderLine]:
        if organization.type == OrganizationType.seller:
            if order.seller_organization_id != organization.id:
                raise HTTPException(status_code=404, detail="Order not found")
            return all_lines

        visible = self._line_service.filter_for_organization(
            all_lines,
            organization.id,
        )
        if not visible:
            raise HTTPException(status_code=404, detail="Order not found")
        return visible

    def _to_detail(
        self,
        order: Order,
        all_lines: list[OrderLine],
        organization: Organization,
    ) -> OrderDetail:
        visible = self._visible_lines(order, all_lines, organization)
        return build_order_detail(order, visible)

    async def list_for_organization(
        self,
        organization: Organization,
    ) -> list[OrderDetail]:
        if organization.type == OrganizationType.seller:
            orders = await self._repo.list_by_seller_organization_id(organization.id)
        else:
            orders = await self._repo.list_by_provider_organization_id(organization.id)

        if not orders:
            return []

        order_ids = [o.id for o in orders]
        all_lines = await self._line_service.list_for_orders(order_ids)
        lines_by_order: dict[UUID, list[OrderLine]] = defaultdict(list)
        for line in all_lines:
            lines_by_order[line.order_id].append(line)

        return [
            self._to_detail(order, lines_by_order[order.id], organization)
            for order in orders
        ]

    async def create_with_lines(
        self,
        body: OrderCreate,
        organization: Organization,
    ) -> OrderDetail:
        if organization.type != OrganizationType.seller:
            raise HTTPException(
                status_code=403,
                detail="Only seller organizations can create orders",
            )

        customer = await self._user_service.find_or_create_customer_by_phone(
            body.customer_phone,
        )

        line_entities: list[OrderLine] = []
        for item in body.lines:
            product = await self._product_service.get_accessible(
                item.product_id,
                organization,
                detail="Product not found",
            )
            line_entities.append(
                self._line_service.build_from_product(product, item.quantity),
            )

        order = Order(
            name=body.name,
            seller_organization_id=organization.id,
            customer_id=customer.id,
        )
        order = await self.create(order)
        lines = await self._line_service.create_for_order(order.id, line_entities)
        return build_order_detail(order, lines)

    async def get_or_404_detail(
        self,
        order_id: UUID,
        organization: Organization,
    ) -> OrderDetail:
        order = await self.get(order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        lines = await self._line_service.list_for_order(order_id)
        return self._to_detail(order, lines, organization)

    async def cancel_order(
        self,
        order_id: UUID,
        organization: Organization,
    ) -> OrderDetail:
        if organization.type != OrganizationType.seller:
            raise HTTPException(
                status_code=403,
                detail="Only seller organizations can cancel orders",
            )

        order = await self.get(order_id)
        if order is None or order.seller_organization_id != organization.id:
            raise HTTPException(status_code=404, detail="Order not found")

        await self._line_service.cancel_all_if_created(order_id)
        lines = await self._line_service.list_for_order(order_id)
        return build_order_detail(order, lines)

    async def cancel_line(
        self,
        order_id: UUID,
        line_id: UUID,
        organization: Organization,
    ) -> OrderDetail:
        order = await self.get(order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")

        line = await self._line_service.get_for_order(order_id, line_id)
        if line is None:
            raise HTTPException(status_code=404, detail="Order line not found")

        if organization.type == OrganizationType.seller:
            if order.seller_organization_id != organization.id:
                raise HTTPException(status_code=404, detail="Order not found")
        elif line.organization_id != organization.id:
            raise HTTPException(status_code=404, detail="Order line not found")

        await self._line_service.cancel_one(line)
        lines = await self._line_service.list_for_order(order_id)
        return self._to_detail(order, lines, organization)
