from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import HTTPException
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
from app.services import provider_seller_link as link_service
from app.services.order.code import generate_next_order_code
from app.services.order.helpers import (
    attach_customers_to_orders,
    attach_items_and_totals,
    attach_order_view,
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
        raise HTTPException(status_code=404, detail="Not found")

    result = await session.execute(
        select(Product).where(
            col(Product.id).in_(product_ids),
            col(Product.organization_id).in_(provider_ids),
        )
    )
    products = {product.id: product for product in result.scalars().all()}
    if len(products) != len(product_ids):
        raise HTTPException(status_code=404, detail="Not found")
    return products


async def _build_order(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    items_data: list[OrderItemCreate],
    *,
    customer_id: UUID = _NIL_UUID,
    code: str = "",
) -> tuple[Order, list[OrderItem]]:
    product_ids = list(dict.fromkeys(item.product_id for item in items_data))
    products = await _resolve_linked_products(
        session,
        user,
        seller_organization_id,
        product_ids,
    )

    order = Order(
        id=uuid4(),
        code=code,
        seller_organization_id=seller_organization_id,
        customer_id=customer_id,
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
                provider_organization_id=product.organization_id,
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
    order, items = await _build_order(
        session,
        user,
        seller_organization_id,
        items_data,
    )
    return attach_order_view(order, items)


async def create_order(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    data: OrderCreate,
) -> Order:
    await get_entity(
        session,
        Customer,
        id=data.customer_id,
        seller_organization_id=seller_organization_id,
    )

    await session.execute(
        select(Organization)
        .where(Organization.id == seller_organization_id)
        .with_for_update()
    )
    code = await generate_next_order_code(session, seller_organization_id)

    order, items = await _build_order(
        session,
        user,
        seller_organization_id,
        data.items,
        customer_id=data.customer_id,
        code=code,
    )
    session.add(order)
    session.add_all(items)
    await session.commit()
    await session.refresh(order)
    for item in items:
        await session.refresh(item)
    attach_order_view(order, items)
    await attach_customers_to_orders(session, [order])
    return order


async def list_orders_for_seller(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    search: str | None = None,
    status: OrderStatus | None = None,
) -> PageResult[Order]:
    stmt = select(Order).where(
        Order.seller_organization_id == seller_organization_id
    )
    if status is not None:
        stmt = stmt.where(Order.status == status)
    clause = order_search_clause(search) if search else None
    if clause is not None:
        stmt = stmt.join(Customer, Customer.id == Order.customer_id).where(clause)
    stmt = stmt.order_by(Order.created_at.desc(), Order.id.desc())
    result = await paginate(session, stmt, pagination)
    await attach_items_and_totals(session, result.items)
    await attach_customers_to_orders(session, result.items)
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
    await attach_items_and_totals(session, [order])
    await attach_customers_to_orders(session, [order])
    return order
