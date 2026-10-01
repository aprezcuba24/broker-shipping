from __future__ import annotations

from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.exceptions import raise_api_error
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.product_share import extract_public_code_from_search
from app.lib.security.access import is_super_admin
from app.lib.utils import utc_now
from app.models.product.product import Product
from app.models.product.seller_product import SellerProduct
from app.models.user.user import User
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.product import SellerProductUpdate
from app.services import product_tag as product_tag_service
from app.services import provider_seller_link as link_service


def attach_sale_price(product: Product, sale_price: int | None) -> Product:
    object.__setattr__(product, "sale_price", sale_price)
    return product


async def load_sale_prices(
    session: AsyncSession,
    *,
    seller_organization_id: UUID,
    product_ids: list[UUID],
) -> dict[UUID, int | None]:
    if not product_ids:
        return {}
    result = await session.execute(
        select(SellerProduct).where(
            SellerProduct.seller_organization_id == seller_organization_id,
            col(SellerProduct.product_id).in_(product_ids),
        )
    )
    return {
        row.product_id: row.sale_price for row in result.scalars().all()
    }


async def attach_sale_prices_to_products(
    session: AsyncSession,
    products: list[Product],
    *,
    seller_organization_id: UUID | None,
) -> None:
    if seller_organization_id is None or not products:
        for product in products:
            attach_sale_price(product, None)
        return
    prices = await load_sale_prices(
        session,
        seller_organization_id=seller_organization_id,
        product_ids=[product.id for product in products],
    )
    for product in products:
        attach_sale_price(product, prices.get(product.id))


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
            raise_api_error("forbidden")
        provider_ids = [provider_id]
    if not provider_ids:
        return PageResult(items=[], total=0)

    stmt = select(Product).where(col(Product.organization_id).in_(provider_ids))
    if name:
        term = name.strip()
        if term:
            code = extract_public_code_from_search(term)
            stmt = stmt.where(
                or_(
                    col(Product.name).ilike(f"%{term}%"),
                    col(Product.public_code).ilike(f"%{code}%"),
                )
            )
    stmt = stmt.order_by(Product.name)
    result = await paginate(session, stmt, pagination)
    await product_tag_service.attach_tags_to_products(session, result.items)
    await attach_sale_prices_to_products(
        session,
        result.items,
        seller_organization_id=seller_organization_id,
    )
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
        raise_api_error("not_found")

    product = await get_entity(session, Product, id=product_id, required=False)
    if product is None or product.organization_id not in provider_ids:
        raise_api_error("not_found")
    await product_tag_service.attach_tags_to_products(session, [product])
    await attach_sale_prices_to_products(
        session,
        [product],
        seller_organization_id=seller_organization_id,
    )
    return product


async def update_seller_product(
    session: AsyncSession,
    product_id: UUID,
    user: User,
    *,
    seller_organization_id: UUID,
    data: SellerProductUpdate,
) -> Product:
    product = await get_accessible_product(
        session,
        product_id,
        user,
        seller_organization_id=seller_organization_id,
    )
    payload = data.model_dump(exclude_unset=True)
    if not payload:
        return product

    existing = await session.get(
        SellerProduct,
        (seller_organization_id, product_id),
    )
    now = utc_now()

    if "sale_price" in payload:
        sale_price = data.sale_price
        if sale_price is None:
            if existing is not None:
                await session.delete(existing)
                await session.commit()
            attach_sale_price(product, None)
            return product

        if sale_price.currency != product.currency:
            raise_api_error("currency_mismatch")
        if sale_price.amount <= product.price:
            raise_api_error("seller_price_below_provider")

        if existing is None:
            session.add(
                SellerProduct(
                    seller_organization_id=seller_organization_id,
                    product_id=product_id,
                    sale_price=sale_price.amount,
                    created_at=now,
                )
            )
        else:
            existing.sale_price = sale_price.amount
            existing.updated_at = now
            session.add(existing)

        await session.commit()
        attach_sale_price(product, sale_price.amount)
        return product

    return product
