from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.exceptions import raise_api_error
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.models.product.product import Product
from app.models.product.product_tag import ProductTag
from app.models.product.tag import Tag
from app.schemas.pagination import PageResult, PaginationParams
from app.services import product_tag as product_tag_service
from app.services import provider_seller_link as link_service
from app.services import seller_product as seller_product_service


async def list_storefront_products(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    tag_id: UUID | None = None,
) -> PageResult[Product]:
    provider_ids = await link_service.list_active_provider_ids(
        session,
        seller_organization_id,
    )
    if not provider_ids:
        return PageResult(items=[], total=0)

    stmt = select(Product).where(
        col(Product.organization_id).in_(provider_ids),
        Product.discarded_at.is_(None),
    )
    if name:
        term = name.strip()
        if term:
            stmt = stmt.where(col(Product.name).ilike(f"%{term}%"))
    if tag_id is not None:
        stmt = stmt.where(
            col(Product.id).in_(
                select(ProductTag.product_id).where(ProductTag.tag_id == tag_id)
            )
        )
    stmt = stmt.order_by(Product.name)
    result = await paginate(session, stmt, pagination)
    await product_tag_service.attach_tags_to_products(session, result.items)
    await seller_product_service.attach_sale_prices_to_products(
        session,
        result.items,
        seller_organization_id=seller_organization_id,
    )
    return result


async def get_storefront_product(
    session: AsyncSession,
    product_id: UUID,
    seller_organization_id: UUID,
) -> Product:
    provider_ids = await link_service.list_active_provider_ids(
        session,
        seller_organization_id,
    )
    if not provider_ids:
        raise_api_error("not_found")

    product = await get_entity(session, Product, id=product_id, required=False)
    if (
        product is None
        or product.discarded_at is not None
        or product.organization_id not in provider_ids
    ):
        raise_api_error("not_found")

    await product_tag_service.attach_tags_to_products(session, [product])
    await seller_product_service.attach_sale_prices_to_products(
        session,
        [product],
        seller_organization_id=seller_organization_id,
    )
    return product


async def list_storefront_tags(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
) -> PageResult[Tag]:
    provider_ids = await link_service.list_active_provider_ids(
        session,
        seller_organization_id,
    )
    if not provider_ids:
        return PageResult(items=[], total=0)

    stmt = (
        select(Tag)
        .where(col(Tag.organization_id).in_(provider_ids))
        .where(Tag.is_active.is_(True))
    )
    if name:
        term = name.strip()
        if term:
            stmt = stmt.where(col(Tag.name).ilike(f"%{term}%"))
    stmt = stmt.order_by(Tag.name)
    return await paginate(session, stmt, pagination)
