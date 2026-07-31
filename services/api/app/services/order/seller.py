from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.models.customer.customer import Customer
from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.organization.organization import Organization
from app.models.product.product import Product
from app.models.user.user import User
from app.schemas.order import OrderCreate, OrderCurrencyTotal
from app.schemas.pagination import PageResult, PaginationParams
from app.services import provider_seller_link as link_service
from app.services.order.code import generate_next_order_code


def compute_order_totals(items: list[OrderItem]) -> list[OrderCurrencyTotal]:
    amounts: dict[Currency, Decimal] = defaultdict(lambda: Decimal("0"))
    for item in items:
        amounts[item.currency] += item.seller_provider_price * item.quantity
    return [
        OrderCurrencyTotal(currency=currency, amount=amount)
        for currency, amount in sorted(amounts.items(), key=lambda pair: pair[0].value)
    ]


def attach_order_view(order: Order, items: list[OrderItem]) -> Order:
    object.__setattr__(order, "items", items)
    object.__setattr__(order, "totals", compute_order_totals(items))
    return order


async def load_items_by_order_ids(
    session: AsyncSession,
    order_ids: list[UUID],
) -> dict[UUID, list[OrderItem]]:
    if not order_ids:
        return {}
    result = await session.execute(
        select(OrderItem)
        .where(col(OrderItem.order_id).in_(order_ids))
        .order_by(OrderItem.created_at, OrderItem.id)
    )
    items_by_order: dict[UUID, list[OrderItem]] = defaultdict(list)
    for item in result.scalars().all():
        items_by_order[item.order_id].append(item)
    return dict(items_by_order)


async def attach_items_and_totals(
    session: AsyncSession,
    orders: list[Order],
) -> None:
    items_by_order = await load_items_by_order_ids(
        session,
        [order.id for order in orders],
    )
    for order in orders:
        attach_order_view(order, items_by_order.get(order.id, []))


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

    product_ids = list(dict.fromkeys(item.product_id for item in data.items))
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

    await session.execute(
        select(Organization)
        .where(Organization.id == seller_organization_id)
        .with_for_update()
    )
    code = await generate_next_order_code(session, seller_organization_id)

    order = Order(
        code=code,
        seller_organization_id=seller_organization_id,
        customer_id=data.customer_id,
        status=OrderStatus.created,
    )
    session.add(order)
    await session.flush()

    items: list[OrderItem] = []
    for item_data in data.items:
        product = products[item_data.product_id]
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            provider_organization_id=product.organization_id,
            unit_provider_price=Decimal("0"),
            seller_provider_price=item_data.seller_provider_price,
            customer_change=item_data.customer_change,
            quantity=item_data.quantity,
            currency=product.currency,
            status=OrderItemStatus.created,
            seller_commission=product.commission,
        )
        session.add(item)
        items.append(item)

    await session.commit()
    await session.refresh(order)
    for item in items:
        await session.refresh(item)
    return attach_order_view(order, items)


async def list_orders_for_seller(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
) -> PageResult[Order]:
    stmt = (
        select(Order)
        .where(Order.seller_organization_id == seller_organization_id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    )
    result = await paginate(session, stmt, pagination)
    await attach_items_and_totals(session, result.items)
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
    return order
