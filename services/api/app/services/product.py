from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence.apply_update import apply_partial_update
from app.models.product.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def list_products_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    name: str | None = None,
) -> list[Product]:
    stmt = select(Product).where(Product.organization_id == organization_id)
    if name:
        stmt = stmt.where(col(Product.name).ilike(f"%{name}%"))
    stmt = stmt.order_by(Product.name)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_product_for_organization(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
) -> Product:
    result = await session.execute(
        select(Product).where(
            Product.id == product_id,
            Product.organization_id == organization_id,
        )
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def create_product(
    session: AsyncSession,
    organization_id: UUID,
    data: ProductCreate,
) -> Product:
    product = Product(
        name=data.name,
        organization_id=organization_id,
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


async def update_product(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
    data: ProductUpdate,
) -> Product:
    product = await get_product_for_organization(session, product_id, organization_id)
    apply_partial_update(product, data)
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


async def delete_product(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
) -> None:
    product = await get_product_for_organization(session, product_id, organization_id)
    await session.delete(product)
    await session.commit()
