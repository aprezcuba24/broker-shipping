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
from app.models.product_stock_movement.enums import (
    StockMovementDirection,
    StockMovementKind,
)
from app.models.product_stock_movement.product_stock_movement import ProductStockMovement
from app.models.product_stock_movement.product_stock_movement_item import (
    ProductStockMovementItem,
)
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.product_stock_movement import ProductStockMovementCreate
from app.services import stock as stock_service


def resolve_direction(
    kind: StockMovementKind,
    direction: StockMovementDirection | None,
) -> StockMovementDirection:
    if kind == StockMovementKind.reception:
        return StockMovementDirection.in_
    if kind == StockMovementKind.shrinkage:
        return StockMovementDirection.out
    if direction is None:
        raise HTTPException(
            status_code=422,
            detail="direction is required for correction movements",
        )
    return direction


def attach_movement_view(
    movement: ProductStockMovement,
    items: list[ProductStockMovementItem],
) -> ProductStockMovement:
    object.__setattr__(movement, "items", items)
    return movement


async def load_items_by_movement_ids(
    session: AsyncSession,
    movement_ids: list[UUID],
) -> dict[UUID, list[ProductStockMovementItem]]:
    if not movement_ids:
        return {}
    result = await session.execute(
        select(ProductStockMovementItem)
        .where(col(ProductStockMovementItem.movement_id).in_(movement_ids))
        .order_by(ProductStockMovementItem.created_at, ProductStockMovementItem.id)
    )
    items_by_movement: dict[UUID, list[ProductStockMovementItem]] = {
        movement_id: [] for movement_id in movement_ids
    }
    for item in result.scalars().all():
        items_by_movement.setdefault(item.movement_id, []).append(item)
    return items_by_movement


async def attach_items_to_movements(
    session: AsyncSession,
    movements: list[ProductStockMovement],
) -> None:
    items_by_movement = await load_items_by_movement_ids(
        session,
        [movement.id for movement in movements],
    )
    for movement in movements:
        attach_movement_view(
            movement,
            items_by_movement.get(movement.id, []),
        )


async def create_movement(
    session: AsyncSession,
    organization_id: UUID,
    data: ProductStockMovementCreate,
) -> ProductStockMovement:
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

    direction = resolve_direction(data.kind, data.direction)
    quantities = {item.product_id: item.quantity for item in data.items}
    if direction == StockMovementDirection.in_:
        await stock_service.increase_products_stock(session, quantities)
    else:
        await stock_service.decrease_products_stock(session, quantities)

    movement = ProductStockMovement(
        id=uuid4(),
        organization_id=organization_id,
        kind=data.kind,
        direction=direction,
        moved_at=data.moved_at if data.moved_at is not None else utc_now(),
        notes=data.notes,
    )
    items = [
        ProductStockMovementItem(
            movement_id=movement.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )
        for item_data in data.items
    ]
    session.add(movement)
    session.add_all(items)
    await session.commit()
    await session.refresh(movement)
    for item in items:
        await session.refresh(item)
    return attach_movement_view(movement, items)


async def list_movements_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    pagination: PaginationParams,
    kind: StockMovementKind | None = None,
) -> PageResult[ProductStockMovement]:
    stmt = select(ProductStockMovement).where(
        ProductStockMovement.organization_id == organization_id
    )
    if kind is not None:
        stmt = stmt.where(ProductStockMovement.kind == kind)
    stmt = stmt.order_by(
        ProductStockMovement.moved_at.desc(),
        ProductStockMovement.id.desc(),
    )
    result = await paginate(session, stmt, pagination)
    await attach_items_to_movements(session, result.items)
    return result


async def get_movement_for_organization(
    session: AsyncSession,
    movement_id: UUID,
    organization_id: UUID,
) -> ProductStockMovement:
    movement = await get_entity(
        session,
        ProductStockMovement,
        id=movement_id,
        organization_id=organization_id,
    )
    await attach_items_to_movements(session, [movement])
    return movement
