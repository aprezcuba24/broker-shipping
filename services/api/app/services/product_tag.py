from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.models.product.product import Product
from app.models.product.product_tag import ProductTag
from app.models.product.tag import Tag


async def get_tag_ids_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    tag_ids: list[UUID],
) -> list[UUID]:
    if not tag_ids:
        return []

    result = await session.execute(
        select(Tag.id).where(
            Tag.organization_id == organization_id,
            col(Tag.id).in_(tag_ids),
        )
    )
    return list(result.scalars().all())


async def set_product_tags(
    session: AsyncSession,
    product_id: UUID,
    tag_ids: list[UUID],
) -> None:
    await session.execute(
        delete(ProductTag).where(ProductTag.product_id == product_id)
    )
    unique_ids = list(dict.fromkeys(tag_ids))
    for tag_id in unique_ids:
        session.add(ProductTag(product_id=product_id, tag_id=tag_id))


async def load_tags_for_products(
    session: AsyncSession,
    products: list[Product],
    *,
    active_only: bool = True,
) -> dict[UUID, list[Tag]]:
    if not products:
        return {}

    product_ids = [p.id for p in products]
    stmt = (
        select(ProductTag.product_id, Tag)
        .join(Tag, Tag.id == ProductTag.tag_id)
        .where(col(ProductTag.product_id).in_(product_ids))
    )
    if active_only:
        stmt = stmt.where(Tag.is_active.is_(True))
    stmt = stmt.order_by(Tag.name)

    result = await session.execute(stmt)
    tags_by_product: dict[UUID, list[Tag]] = defaultdict(list)
    for product_id, tag in result.all():
        tags_by_product[product_id].append(tag)
    return dict(tags_by_product)


async def attach_tags_to_products(
    session: AsyncSession,
    products: list[Product],
    *,
    active_only: bool = True,
) -> None:
    tags_by_product = await load_tags_for_products(
        session,
        products,
        active_only=active_only,
    )
    for product in products:
        object.__setattr__(
            product,
            "tags",
            tags_by_product.get(product.id, []),
        )
