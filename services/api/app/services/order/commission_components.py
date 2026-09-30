from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order.commission_component import (
    CommissionComponentKind,
    OrderItemCommissionComponent,
)
from app.models.order.order_item import OrderItem
from app.models.product.product import Product


def build_commission_components_for_item(
    item: OrderItem,
    product: Product,
) -> list[OrderItemCommissionComponent]:
    """Snapshot commission reasons for a newly created order item."""
    components: list[OrderItemCommissionComponent] = []

    provider_unit = product.commission if product.has_commission else 0
    if provider_unit > 0:
        components.append(
            OrderItemCommissionComponent(
                id=uuid4(),
                order_item_id=item.id,
                kind=CommissionComponentKind.provider_commission,
                unit_amount=provider_unit,
                currency=product.commission_currency,
            )
        )

    markup_unit = item.seller_provider_price - item.unit_provider_price
    if markup_unit > 0:
        components.append(
            OrderItemCommissionComponent(
                id=uuid4(),
                order_item_id=item.id,
                kind=CommissionComponentKind.price_markup,
                unit_amount=markup_unit,
                currency=item.currency,
            )
        )

    return components


async def create_components_for_items(
    session: AsyncSession,
    items: list[OrderItem],
    products: dict[UUID, Product],
) -> list[OrderItemCommissionComponent]:
    components: list[OrderItemCommissionComponent] = []
    for item in items:
        product = products[item.product_id]
        components.extend(build_commission_components_for_item(item, product))
    if components:
        session.add_all(components)
    return components
