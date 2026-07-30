from __future__ import annotations

from uuid import UUID

from sqlalchemy import exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.lib.persistence.apply_update import apply_partial_update
from app.lib.persistence.pagination import paginate
from app.models.product.product import Product
from app.models.product.product_tag import ProductTag
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.product import ProductCreate, ProductUpdate
from app.services import product_tag as product_tag_service


async def list_products_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    tag_ids: list[UUID] | None = None,
) -> PageResult[Product]:
    stmt = select(Product).where(Product.organization_id == organization_id)
    if name:
        stmt = stmt.where(col(Product.name).ilike(f"%{name}%"))
    if tag_ids:
        unique_tag_ids = list(dict.fromkeys(tag_ids))
        for tag_id in unique_tag_ids:
            stmt = stmt.where(
                exists().where(
                    ProductTag.product_id == Product.id,
                    ProductTag.tag_id == tag_id,
                )
            )
    stmt = stmt.order_by(Product.name)
    result = await paginate(session, stmt, pagination)
    await product_tag_service.attach_tags_to_products(session, result.items)
    return result


async def get_product_for_organization(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
) -> Product:
    product = await get_entity(
        session,
        Product,
        id=product_id,
        organization_id=organization_id,
    )
    await product_tag_service.attach_tags_to_products(session, [product])
    return product


async def create_product(
    session: AsyncSession,
    organization_id: UUID,
    data: ProductCreate,
) -> Product:
    tag_ids = await product_tag_service.get_tag_ids_for_organization(
        session,
        organization_id,
        data.tag_ids,
    )
    product = Product(
        name=data.name,
        organization_id=organization_id,
    )
    session.add(product)
    await session.flush()
    await product_tag_service.set_product_tags(session, product.id, tag_ids)
    await session.commit()
    await session.refresh(product)
    await product_tag_service.attach_tags_to_products(session, [product])
    return product


async def update_product(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
    data: ProductUpdate,
) -> Product:
    product = await get_entity(
        session,
        Product,
        id=product_id,
        organization_id=organization_id,
    )
    if data.tag_ids is not None:
        tag_ids = await product_tag_service.get_tag_ids_for_organization(
            session,
            organization_id,
            data.tag_ids,
        )
        await product_tag_service.set_product_tags(session, product.id, tag_ids)
    apply_partial_update(product, data, exclude={"tag_ids"})
    session.add(product)
    await session.commit()
    await session.refresh(product)
    await product_tag_service.attach_tags_to_products(session, [product])
    return product


async def delete_product(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
) -> None:
    product = await get_entity(
        session,
        Product,
        id=product_id,
        organization_id=organization_id,
    )
    await session.delete(product)
    await session.commit()
