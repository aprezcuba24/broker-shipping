from __future__ import annotations

from collections import defaultdict
from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException

from app.lib.persistence import BaseService
from app.modules.orders.models.address import Address
from app.modules.orders.models.customer import Customer
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine
from app.modules.orders.invoice_code import format_invoice_code
from app.modules.orders.repositories import OrderRepository
from app.modules.orders.schemas import (
    OrderCreate,
    OrderDetail,
    build_address_snapshot,
    build_customer_snapshot,
    build_order_detail,
)
from app.modules.orders.services.address_service import AddressService
from app.modules.orders.services.customer_service import CustomerService
from app.modules.orders.services.order_line_service import OrderLineService
from app.modules.organization.models import Organization, OrganizationType
from app.modules.organization.repositories import (
    OrganizationRepository,
    SellerOrganizationDataRepository,
)
from app.modules.products.services import SellerProductService


class OrderService(BaseService[Order]):
    def __init__(
        self,
        repository: OrderRepository,
        line_service: OrderLineService,
        product_service: SellerProductService,
        customer_service: CustomerService,
        address_service: AddressService,
        org_repository: OrganizationRepository,
        seller_data_repository: SellerOrganizationDataRepository,
    ) -> None:
        super().__init__(repository)
        self._line_service = line_service
        self._product_service = product_service
        self._customer_service = customer_service
        self._address_service = address_service
        self._org_repo = org_repository
        self._seller_data_repo = seller_data_repository

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

    async def _orgs_by_id_for_order(
        self,
        order: Order,
        lines: Sequence[OrderLine],
    ) -> dict[UUID, Organization]:
        org_ids = {line.organization_id for line in lines}
        org_ids.add(order.seller_organization_id)
        orgs = await self._org_repo.list_by_ids(org_ids)
        return {org.id: org for org in orgs}

    def _to_detail(
        self,
        order: Order,
        all_lines: list[OrderLine],
        organization: Organization,
        orgs_by_id: dict[UUID, Organization],
    ) -> OrderDetail:
        visible = self._visible_lines(order, all_lines, organization)
        return build_order_detail(order, visible, orgs_by_id)

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

        seller_ids = {order.seller_organization_id for order in orders}
        line_org_ids = {line.organization_id for line in all_lines}
        orgs_by_id = {
            org.id: org
            for org in await self._org_repo.list_by_ids(seller_ids | line_org_ids)
        }
        return [
            self._to_detail(order, lines_by_order[order.id], organization, orgs_by_id)
            for order in orders
        ]

    async def create_with_lines(
        self,
        body: OrderCreate,
        organization: Organization,
    ) -> OrderDetail:
        customer, address = await self._customer_service.resolve_customer_and_address(
            customer_id=body.customer_id,
            customer=body.customer,
            address_id=body.address_id,
            address=body.address,
            organization=organization,
        )

        line_entities: list[OrderLine] = []
        for item in body.lines:
            product = await self._product_service.get_for_seller_organization(
                item.product_id,
                organization.id,
                detail="Product not found",
            )
            line_entities.append(
                self._line_service.build_from_product(product, item.quantity, item.price),
            )

        invoice_number = await self._seller_data_repo.allocate_invoice_number(organization.id)
        order = Order(
            name=format_invoice_code(invoice_number),
            seller_organization_id=organization.id,
            customer_id=customer.id,
            customer_snapshot=build_customer_snapshot(customer),
            address_snapshot=build_address_snapshot(address),
        )
        order = await self.create(order)
        lines = await self._line_service.create_for_order(order.id, line_entities)
        orgs_by_id = await self._orgs_by_id_for_order(order, lines)
        return build_order_detail(order, lines, orgs_by_id)

    async def get_or_404_detail(
        self,
        order_id: UUID,
        organization: Organization,
    ) -> OrderDetail:
        order = await self.get(order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        lines = await self._line_service.list_for_order(order_id)
        orgs_by_id = await self._orgs_by_id_for_order(order, lines)
        return self._to_detail(order, lines, organization, orgs_by_id)

    async def cancel_order(
        self,
        order_id: UUID,
        organization: Organization,
    ) -> OrderDetail:
        order = await self.get(order_id)
        if order is None or order.seller_organization_id != organization.id:
            raise HTTPException(status_code=404, detail="Order not found")

        await self._line_service.cancel_all_if_created(order_id)
        lines = await self._line_service.list_for_order(order_id)
        orgs_by_id = await self._orgs_by_id_for_order(order, lines)
        return build_order_detail(order, lines, orgs_by_id)

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
        orgs_by_id = await self._orgs_by_id_for_order(order, lines)
        return self._to_detail(order, lines, organization, orgs_by_id)
