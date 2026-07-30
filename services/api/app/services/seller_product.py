from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.security.access import is_super_admin
from app.models.product.product import Product
from app.models.user.user import User
from app.schemas.pagination import PageResult, PaginationParams
from app.services import product_tag as product_tag_service
from app.services import provider_seller_link as link_service


async def list_accessible_products(
    session: AsyncSession,
    user: User,
    *,
    pagination: PaginationParams,
    seller_organization_id: UUID | None = None,
    name: str | None = None,
    provider_id: UUID | None = None,
) -> PageResult[Product]:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user,
        seller_organization_id,
    )
    if provider_id is not None:
        if not is_super_admin(user) and provider_id not in provider_ids:
            raise HTTPException(status_code=403, detail="Forbidden")
        provider_ids = [provider_id]
    if not provider_ids:
        return PageResult(items=[], total=0)

    stmt = select(Product).where(col(Product.organization_id).in_(provider_ids))
    if name:
        stmt = stmt.where(col(Product.name).ilike(f"%{name}%"))
    stmt = stmt.order_by(Product.name)
    result = await paginate(session, stmt, pagination)
    await product_tag_service.attach_tags_to_products(session, result.items)
    return result


async def get_accessible_product(
    session: AsyncSession,
    product_id: UUID,
    user: User,
    *,
    seller_organization_id: UUID | None = None,
) -> Product:
    provider_ids = await link_service.resolve_provider_ids(
        session,
        user,
        seller_organization_id,
    )
    if not provider_ids:
        raise HTTPException(status_code=404, detail="Not found")

    product = await get_entity(session, Product, id=product_id, required=False)
    if product is None or product.organization_id not in provider_ids:
        raise HTTPException(status_code=404, detail="Not found")
    await product_tag_service.attach_tags_to_products(session, [product])
    return product
