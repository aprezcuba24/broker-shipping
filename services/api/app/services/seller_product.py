from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.models.product.product import Product
from app.services import provider_seller_link as link_service


async def list_accessible_products(
    session: AsyncSession,
    user_id: UUID,
    *,
    seller_organization_id: UUID | None = None,
    name: str | None = None,
    provider_id: UUID | None = None,
) -> list[Product]:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user_id,
        seller_organization_id,
    )
    if provider_id is not None:
        if provider_id not in provider_ids:
            raise HTTPException(status_code=403, detail="Forbidden")
        provider_ids = [provider_id]
    if not provider_ids:
        return []

    stmt = select(Product).where(col(Product.organization_id).in_(provider_ids))
    if name:
        stmt = stmt.where(col(Product.name).ilike(f"%{name}%"))
    stmt = stmt.order_by(Product.name)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_accessible_product(
    session: AsyncSession,
    product_id: UUID,
    user_id: UUID,
    *,
    seller_organization_id: UUID | None = None,
) -> Product:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user_id,
        seller_organization_id,
    )
    if not provider_ids:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await session.execute(
        select(Product).where(
            Product.id == product_id,
            col(Product.organization_id).in_(provider_ids),
        )
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
