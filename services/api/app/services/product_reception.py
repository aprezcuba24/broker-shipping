from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.utils import utc_now
from app.models.product.product import Product
from app.models.product_reception.product_reception import ProductReception
from app.models.product_reception.product_reception_item import ProductReceptionItem
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.product_reception import ProductReceptionCreate
from app.services import stock as stock_service


def attach_reception_view(
    reception: ProductReception,
    items: list[ProductReceptionItem],
) -> ProductReception:
    object.__setattr__(reception, "items", items)
    return reception


async def load_items_by_reception_ids(
    session: AsyncSession,
    reception_ids: list[UUID],
) -> dict[UUID, list[ProductReceptionItem]]:
    if not reception_ids:
        return {}
    result = await session.execute(
        select(ProductReceptionItem)
        .where(col(ProductReceptionItem.reception_id).in_(reception_ids))
        .order_by(ProductReceptionItem.created_at, ProductReceptionItem.id)
    )
    items_by_reception: dict[UUID, list[ProductReceptionItem]] = {
        reception_id: [] for reception_id in reception_ids
    }
    for item in result.scalars().all():
        items_by_reception.setdefault(item.reception_id, []).append(item)
    return items_by_reception


async def attach_items_to_receptions(
    session: AsyncSession,
    receptions: list[ProductReception],
) -> None:
    items_by_reception = await load_items_by_reception_ids(
        session,
        [reception.id for reception in receptions],
    )
    for reception in receptions:
        attach_reception_view(
            reception,
            items_by_reception.get(reception.id, []),
        )


async def create_reception(
    session: AsyncSession,
    organization_id: UUID,
    data: ProductReceptionCreate,
) -> ProductReception:
    product_ids = [item.product_id for item in data.items]
    result = await session.execute(
        select(Product).where(
            col(Product.id).in_(product_ids),
            Product.organization_id == organization_id,
        )
    )
    products = {product.id: product for product in result.scalars().all()}
    if len(products) != len(product_ids):
        raise HTTPException(status_code=404, detail="Not found")

    quantities = {item.product_id: item.quantity for item in data.items}
    await stock_service.increase_products_stock(session, quantities)

    reception = ProductReception(
        id=uuid4(),
        organization_id=organization_id,
        received_at=data.received_at if data.received_at is not None else utc_now(),
    )
    items = [
        ProductReceptionItem(
            reception_id=reception.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )
        for item_data in data.items
    ]
    session.add(reception)
    session.add_all(items)
    await session.commit()
    await session.refresh(reception)
    for item in items:
        await session.refresh(item)
    return attach_reception_view(reception, items)


async def list_receptions_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    pagination: PaginationParams,
) -> PageResult[ProductReception]:
    stmt = (
        select(ProductReception)
        .where(ProductReception.organization_id == organization_id)
        .order_by(
            ProductReception.received_at.desc(),
            ProductReception.id.desc(),
        )
    )
    result = await paginate(session, stmt, pagination)
    await attach_items_to_receptions(session, result.items)
    return result


async def get_reception_for_organization(
    session: AsyncSession,
    reception_id: UUID,
    organization_id: UUID,
) -> ProductReception:
    reception = await get_entity(
        session,
        ProductReception,
        id=reception_id,
        organization_id=organization_id,
    )
    await attach_items_to_receptions(session, [reception])
    return reception
