from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.models.customer.customer import Customer
from app.models.order.enums import OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.organization.organization import Organization
from app.models.product.product import Product
from app.models.user.user import User
from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.pagination import PageResult, PaginationParams
from app.events.types import OrderCreatedEvent
from app.lib.exceptions import raise_api_error
from app.lib.events import emit
from app.services import provider_seller_link as link_service
from app.services import stock as stock_service
from app.services.customer.helpers import attach_addresses_to_customers
from app.services.order.code import generate_next_order_code
from app.services.order.helpers import (
    attach_order_view,
    attach_order_relations,
    order_search_clause,
)

_NIL_UUID = UUID(int=0)


async def _resolve_linked_products(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    product_ids: list[UUID],
) -> dict[UUID, Product]:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user,
        seller_organization_id,
    )
    if not provider_ids:
        raise_api_error("not_found")

    result = await session.execute(
        select(Product).where(
            col(Product.id).in_(product_ids),
            col(Product.organization_id).in_(provider_ids),
        )
    )
    products = {product.id: product for product in result.scalars().all()}
    if len(products) != len(product_ids):
        raise_api_error("not_found")
    return products


async def _organization_names_by_id(
    session: AsyncSession,
    organization_ids: list[UUID],
) -> dict[UUID, str]:
    if not organization_ids:
        return {}
    result = await session.execute(
        select(Organization).where(col(Organization.id).in_(organization_ids))
    )
    return {org.id: org.name for org in result.scalars().all()}


def _quantities_by_product(items_data: list[OrderItemCreate]) -> dict[UUID, int]:
    return {item.product_id: item.quantity for item in items_data}


async def _build_order(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    items_data: list[OrderItemCreate],
    *,
    customer_id: UUID = _NIL_UUID,
    customer: Customer | None = None,
    seller_organization_name: str = "",
    code: str = "",
) -> tuple[Order, list[OrderItem]]:
    product_ids = list(dict.fromkeys(item.product_id for item in items_data))
    products = await _resolve_linked_products(
        session,
        user,
        seller_organization_id,
        product_ids,
    )
    provider_ids = list({product.organization_id for product in products.values()})
    provider_names = await _organization_names_by_id(session, provider_ids)

    customer_name = ""
    customer_ci = ""
    customer_phone = ""
    customer_address = ""
    customer_province_name = ""
    customer_municipality_name = ""
    if customer is not None:
        customer_name = customer.name
        customer_ci = customer.ci
        customer_phone = customer.phone
        address = getattr(customer, "address", None)
        if address is not None:
            customer_address = address.address
            customer_province_name = getattr(address, "province_name", None) or ""
            customer_municipality_name = (
                getattr(address, "municipality_name", None) or ""
            )

    order = Order(
        id=uuid4(),
        code=code,
        seller_organization_id=seller_organization_id,
        seller_organization_name=seller_organization_name,
        customer_id=customer_id,
        customer_name=customer_name,
        customer_ci=customer_ci,
        customer_phone=customer_phone,
        customer_address=customer_address,
        customer_province_name=customer_province_name,
        customer_municipality_name=customer_municipality_name,
        status=OrderStatus.created,
    )
    items: list[OrderItem] = []
    for item_data in items_data:
        product = products[item_data.product_id]
        seller_provider_price = (
            item_data.seller_provider_price
            if "seller_provider_price" in item_data.model_fields_set
            else product.price
        )
        items.append(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_image_key=product.image_key,
                provider_organization_id=product.organization_id,
                provider_organization_name=provider_names.get(
                    product.organization_id, ""
                ),
                unit_provider_price=product.price,
                seller_provider_price=seller_provider_price,
                customer_change=item_data.customer_change,
                quantity=item_data.quantity,
                currency=product.currency,
                status=OrderItemStatus.created,
                seller_commission=product.commission,
            )
        )
    return order, items


async def preview_order(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    items_data: list[OrderItemCreate],
) -> Order:
    seller_names = await _organization_names_by_id(session, [seller_organization_id])
    order, items = await _build_order(
        session,
        user,
        seller_organization_id,
        items_data,
        seller_organization_name=seller_names.get(seller_organization_id, ""),
    )
    await stock_service.assert_products_available(
        session,
        _quantities_by_product(items_data),
    )
    return attach_order_view(order, items)


async def create_order(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    data: OrderCreate,
) -> Order:
    customer = await get_entity(
        session,
        Customer,
        id=data.customer_id,
        seller_organization_id=seller_organization_id,
    )
    await attach_addresses_to_customers(session, [customer])

    await session.execute(
        select(Organization)
        .where(Organization.id == seller_organization_id)
        .with_for_update()
    )
    seller_names = await _organization_names_by_id(session, [seller_organization_id])
    code = await generate_next_order_code(session, seller_organization_id)

    order, items = await _build_order(
        session,
        user,
        seller_organization_id,
        data.items,
        customer_id=data.customer_id,
        customer=customer,
        seller_organization_name=seller_names.get(seller_organization_id, ""),
        code=code,
    )
    session.add(order)
    session.add_all(items)
    await session.flush()
    await emit(
        OrderCreatedEvent(order_id=order.id),
        session=session,
        propagate_errors=True,
    )
    await session.commit()
    await session.refresh(order)
    for item in items:
        await session.refresh(item)
    attach_order_view(order, items)
    await attach_order_relations(session, [order])
    return order


async def list_orders_for_seller(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    search: str | None = None,
    status: OrderStatus | None = None,
    customer_id: UUID | None = None,
) -> PageResult[Order]:
    stmt = select(Order).where(
        Order.seller_organization_id == seller_organization_id
    )
    if status is not None:
        stmt = stmt.where(Order.status == status)
    if customer_id is not None:
        stmt = stmt.where(Order.customer_id == customer_id)
    clause = order_search_clause(search) if search else None
    if clause is not None:
        stmt = stmt.where(clause)
    stmt = stmt.order_by(Order.created_at.desc(), Order.id.desc())
    result = await paginate(session, stmt, pagination)
    await attach_order_relations(session, result.items)
    return result


async def get_order_for_seller(
    session: AsyncSession,
    order_id: UUID,
    seller_organization_id: UUID,
) -> Order:
    order = await get_entity(
        session,
        Order,
        id=order_id,
        seller_organization_id=seller_organization_id,
    )
    await attach_order_relations(session, [order])
    return order
