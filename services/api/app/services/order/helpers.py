from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.storage.deps import get_object_storage
from app.models.customer.customer import Customer
from app.models.order.enums import Currency, OrderItemStatus, OrderStatus
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.organization.enums import OrganizationType
from app.schemas.customer import AddressPublic, CustomerPublic
from app.schemas.order import OrderCurrencyTotal, OrderItemPublic, OrderPublic
from app.schemas.organization import OrganizationPublic
from app.types import PurchaseTier

_NIL_UUID = UUID(int=0)


def compute_order_totals(items: list[OrderItem]) -> list[OrderCurrencyTotal]:
    amounts: dict[Currency, int] = defaultdict(int)
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


def derive_order_status(items: list[OrderItem]) -> OrderStatus:
    if not items:
        return OrderStatus.created

    statuses = {item.status for item in items}
    if statuses == {OrderItemStatus.canceled}:
        return OrderStatus.canceled
    if statuses <= {OrderItemStatus.delivered, OrderItemStatus.canceled}:
        return OrderStatus.finished
    if statuses & {OrderItemStatus.reviewed, OrderItemStatus.sent}:
        return OrderStatus.processing
    if statuses == {OrderItemStatus.created}:
        return OrderStatus.created
    return OrderStatus.processing


async def load_items_by_order_ids(
    session: AsyncSession,
    order_ids: list[UUID],
    *,
    provider_organization_id: UUID | None = None,
) -> dict[UUID, list[OrderItem]]:
    if not order_ids:
        return {}
    stmt = select(OrderItem).where(col(OrderItem.order_id).in_(order_ids))
    if provider_organization_id is not None:
        stmt = stmt.where(
            OrderItem.provider_organization_id == provider_organization_id
        )
    stmt = stmt.order_by(OrderItem.created_at, OrderItem.id)
    result = await session.execute(stmt)
    items_by_order: dict[UUID, list[OrderItem]] = defaultdict(list)
    for item in result.scalars().all():
        items_by_order[item.order_id].append(item)
    return dict(items_by_order)


async def attach_items_and_totals(
    session: AsyncSession,
    orders: list[Order],
    *,
    provider_organization_id: UUID | None = None,
) -> None:
    items_by_order = await load_items_by_order_ids(
        session,
        [order.id for order in orders],
        provider_organization_id=provider_organization_id,
    )
    for order in orders:
        attach_order_view(order, items_by_order.get(order.id, []))


async def _purchase_tiers_by_phone(
    session: AsyncSession,
    phones: list[str],
) -> dict[str, PurchaseTier]:
    if not phones:
        return {}
    result = await session.execute(
        select(Customer.phone, Customer.purchase_tier).where(
            col(Customer.phone).in_(phones)
        )
    )
    tiers: dict[str, PurchaseTier] = {}
    for phone, tier in result.all():
        value: PurchaseTier = tier if tier in (0, 1, 5, 10) else 0
        current = tiers.get(phone, 0)
        if value > current:
            tiers[phone] = value
        elif phone not in tiers:
            tiers[phone] = value
    return tiers


def _customer_from_order_snapshot(
    order: Order,
    *,
    purchase_tier: PurchaseTier = 0,
) -> CustomerPublic | None:
    if not order.customer_id or order.customer_id == _NIL_UUID:
        return None
    address: AddressPublic | None = None
    if order.customer_address:
        address = AddressPublic(
            id=_NIL_UUID,
            address=order.customer_address,
            province_id=_NIL_UUID,
            municipality_id=_NIL_UUID,
            customer_id=order.customer_id,
            created_at=order.created_at,
            updated_at=None,
            province_name=order.customer_province_name or None,
            municipality_name=order.customer_municipality_name or None,
        )
    return CustomerPublic(
        id=order.customer_id,
        name=order.customer_name,
        ci=order.customer_ci,
        phone=order.customer_phone,
        purchase_tier=purchase_tier,
        seller_organization_id=order.seller_organization_id,
        created_at=order.created_at,
        updated_at=None,
        address=address,
        addresses=[],
    )


def _seller_organization_from_order_snapshot(
    order: Order,
) -> OrganizationPublic | None:
    if not order.seller_organization_id:
        return None
    if not order.seller_organization_name:
        return None
    return OrganizationPublic(
        id=order.seller_organization_id,
        name=order.seller_organization_name,
        type=OrganizationType.seller,
        created_at=order.created_at,
        updated_at=None,
    )


def order_item_to_public(item: OrderItem) -> OrderItemPublic:
    return OrderItemPublic(
        id=item.id,
        order_id=item.order_id,
        product_id=item.product_id,
        product_name=item.product_name,
        product_image_url=get_object_storage().build_public_url(item.product_image_key),
        provider_organization_id=item.provider_organization_id,
        provider_organization_name=item.provider_organization_name,
        unit_provider_price=item.unit_provider_price,
        seller_provider_price=item.seller_provider_price,
        customer_change=item.customer_change,
        quantity=item.quantity,
        currency=item.currency,
        status=item.status,
        seller_commission=item.seller_commission,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def order_to_public(order: Order) -> OrderPublic:
    items = getattr(order, "items", []) or []
    totals = getattr(order, "totals", None) or compute_order_totals(items)
    customer = getattr(order, "customer", None)
    if customer is None and order.customer_id and order.customer_id != _NIL_UUID:
        customer = _customer_from_order_snapshot(order)
    seller_organization = getattr(order, "seller_organization", None)
    if seller_organization is None:
        seller_organization = _seller_organization_from_order_snapshot(order)
    return OrderPublic(
        id=order.id,
        code=order.code,
        seller_organization_id=order.seller_organization_id,
        customer_id=order.customer_id,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[order_item_to_public(item) for item in items],
        totals=list(totals),
        customer=customer,
        seller_organization=seller_organization,
    )


async def attach_snapshot_relations(
    session: AsyncSession,
    orders: list[Order],
) -> None:
    phones = list(
        {
            order.customer_phone
            for order in orders
            if order.customer_phone
            and order.customer_id
            and order.customer_id != _NIL_UUID
        }
    )
    tiers_by_phone = await _purchase_tiers_by_phone(session, phones)
    for order in orders:
        object.__setattr__(
            order,
            "customer",
            _customer_from_order_snapshot(
                order,
                purchase_tier=tiers_by_phone.get(order.customer_phone, 0),
            ),
        )
        object.__setattr__(
            order,
            "seller_organization",
            _seller_organization_from_order_snapshot(order),
        )


async def attach_order_relations(
    session: AsyncSession,
    orders: list[Order],
    *,
    provider_organization_id: UUID | None = None,
) -> None:
    await attach_items_and_totals(
        session,
        orders,
        provider_organization_id=provider_organization_id,
    )
    await attach_snapshot_relations(session, orders)


# Backward-compatible aliases used by dashboard / provider until fully migrated.
async def attach_customers_to_orders(
    session: AsyncSession,
    orders: list[Order],
) -> None:
    await attach_snapshot_relations(session, orders)


async def attach_seller_organizations_to_orders(
    session: AsyncSession,
    orders: list[Order],
) -> None:
    await attach_snapshot_relations(session, orders)


def order_search_clause(search: str):
    term = search.strip()
    if not term:
        return None

    digits_only = term.isdigit()
    has_letter = any(c.isalpha() for c in term)
    has_digit = any(c.isdigit() for c in term)

    if digits_only:
        if len(term) <= 11:
            return or_(
                Order.customer_ci == term,
                col(Order.customer_phone).ilike(f"%{term}%"),
            )
        return col(Order.customer_phone).ilike(f"%{term}%")

    if has_letter and has_digit:
        return col(Order.code).ilike(f"%{term}%")

    if has_letter and not has_digit:
        return col(Order.customer_name).ilike(f"%{term}%")

    return or_(
        col(Order.code).ilike(f"%{term}%"),
        col(Order.customer_name).ilike(f"%{term}%"),
        col(Order.customer_phone).ilike(f"%{term}%"),
        Order.customer_ci == term,
    )


async def order_item_image_key_in_use(
    session: AsyncSession,
    image_key: str,
) -> bool:
    result = await session.execute(
        select(OrderItem.id)
        .where(OrderItem.product_image_key == image_key)
        .limit(1)
    )
    return result.scalar_one_or_none() is not None
