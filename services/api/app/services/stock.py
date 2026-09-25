from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.exceptions import raise_api_error
from app.lib.utils import utc_now
from app.models.product.product import Product


async def lock_products(
    session: AsyncSession,
    product_ids: list[UUID],
) -> dict[UUID, Product]:
    """Lock products by id (ordered) for stock mutations. Caller must supply unique ids."""
    if not product_ids:
        return {}
    ordered_ids = sorted(set(product_ids), key=str)
    result = await session.execute(
        select(Product)
        .where(col(Product.id).in_(ordered_ids))
        .order_by(Product.id)
        .with_for_update()
    )
    products = {product.id: product for product in result.scalars().all()}
    if len(products) != len(ordered_ids):
        raise_api_error("not_found")
    return products


def _touch(product: Product) -> None:
    product.updated_at = utc_now()


def _raise_insufficient_stock(product: Product, quantity: int) -> None:
    raise_api_error(
        "insufficient_stock",
        product_id=product.id,
        product_name=product.name,
        available=product.stock,
        requested=quantity,
    )


def _raise_insufficient_reserved(product: Product, quantity: int) -> None:
    raise_api_error(
        "insufficient_reserved_stock",
        product_id=product.id,
        product_name=product.name,
        reserved=product.reserved,
        requested=quantity,
    )


def increase_stock(product: Product, quantity: int) -> None:
    if quantity <= 0:
        raise_api_error("quantity_must_be_positive")
    product.stock += quantity
    _touch(product)


def decrease_stock(product: Product, quantity: int) -> None:
    if quantity <= 0:
        raise_api_error("quantity_must_be_positive")
    if product.stock < quantity:
        _raise_insufficient_stock(product, quantity)
    product.stock -= quantity
    _touch(product)


def reserve_stock(product: Product, quantity: int) -> None:
    if quantity <= 0:
        raise_api_error("quantity_must_be_positive")
    if product.stock < quantity:
        _raise_insufficient_stock(product, quantity)
    product.stock -= quantity
    product.reserved += quantity
    _touch(product)


def release_stock(product: Product, quantity: int) -> None:
    if quantity <= 0:
        raise_api_error("quantity_must_be_positive")
    if product.reserved < quantity:
        _raise_insufficient_reserved(product, quantity)
    product.reserved -= quantity
    product.stock += quantity
    _touch(product)


def consume_stock(product: Product, quantity: int) -> None:
    if quantity <= 0:
        raise_api_error("quantity_must_be_positive")
    if product.reserved < quantity:
        _raise_insufficient_reserved(product, quantity)
    product.reserved -= quantity
    _touch(product)


async def increase_products_stock(
    session: AsyncSession,
    quantities: dict[UUID, int],
) -> dict[UUID, Product]:
    products = await lock_products(session, list(quantities.keys()))
    for product_id, quantity in quantities.items():
        increase_stock(products[product_id], quantity)
        session.add(products[product_id])
    return products


async def decrease_products_stock(
    session: AsyncSession,
    quantities: dict[UUID, int],
) -> dict[UUID, Product]:
    products = await lock_products(session, list(quantities.keys()))
    for product_id, quantity in quantities.items():
        decrease_stock(products[product_id], quantity)
        session.add(products[product_id])
    return products


async def reserve_products_stock(
    session: AsyncSession,
    quantities: dict[UUID, int],
) -> dict[UUID, Product]:
    products = await lock_products(session, list(quantities.keys()))
    for product_id, quantity in quantities.items():
        reserve_stock(products[product_id], quantity)
        session.add(products[product_id])
    return products


async def release_products_stock(
    session: AsyncSession,
    quantities: dict[UUID, int],
) -> dict[UUID, Product]:
    products = await lock_products(session, list(quantities.keys()))
    for product_id, quantity in quantities.items():
        release_stock(products[product_id], quantity)
        session.add(products[product_id])
    return products


async def consume_products_stock(
    session: AsyncSession,
    quantities: dict[UUID, int],
) -> dict[UUID, Product]:
    products = await lock_products(session, list(quantities.keys()))
    for product_id, quantity in quantities.items():
        consume_stock(products[product_id], quantity)
        session.add(products[product_id])
    return products


async def assert_products_available(
    session: AsyncSession,
    quantities: dict[UUID, int],
) -> None:
    """Validate stock without locking/mutating (for order preview)."""
    if not quantities:
        return
    product_ids = list(quantities.keys())
    result = await session.execute(
        select(Product).where(col(Product.id).in_(product_ids))
    )
    products = {product.id: product for product in result.scalars().all()}
    if len(products) != len(product_ids):
        raise_api_error("not_found")
    for product_id, quantity in quantities.items():
        product = products[product_id]
        if product.stock < quantity:
            _raise_insufficient_stock(product, quantity)
