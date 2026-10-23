from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.exceptions import raise_api_error
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.storage.deps import get_object_storage
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.product.product import Product
from app.models.product.product_tag import ProductTag
from app.models.product.tag import Tag
from app.models.user.user import User
from app.schemas.customer import CustomerCreate
from app.schemas.money import Money
from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.storefront import (
    StorefrontCheckoutCreate,
    StorefrontCheckoutItemPublic,
    StorefrontCheckoutPublic,
    StorefrontInfoPublic,
    StorefrontProductPublic,
    StorefrontTagPublic,
)
from app.services import provider_seller_link as link_service
from app.services import seller_product as seller_product_service
from app.services.customer import seller as seller_customer_service
from app.services.order import seller as seller_order_service
from app.services.order.helpers import compute_order_totals
from app.services import product_tag as product_tag_service


async def require_seller_organization(
    session: AsyncSession,
    organization_id: UUID,
) -> Organization:
    organization = await get_entity(
        session,
        Organization,
        id=organization_id,
        required=False,
    )
    if organization is None or organization.type != OrganizationType.seller:
        raise_api_error("not_found")
    return organization


async def resolve_storefront_actor(
    session: AsyncSession,
    seller_organization_id: UUID,
) -> User:
    result = await session.execute(
        select(User)
        .join(UserOrganization, UserOrganization.user_id == User.id)
        .where(
            UserOrganization.organization_id == seller_organization_id,
            UserOrganization.is_active.is_(True),
            User.is_super_admin.is_(False),
        )
        .order_by(UserOrganization.joined_at)
        .limit(1)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise_api_error("storefront_no_actor")
    return user


def storefront_product_to_public(product: Product) -> StorefrontProductPublic:
    sale_price_amount = getattr(product, "sale_price", None)
    amount = sale_price_amount if sale_price_amount is not None else product.price
    tags = [
        StorefrontTagPublic(id=tag.id, name=tag.name)
        for tag in (getattr(product, "tags", None) or [])
    ]
    return StorefrontProductPublic(
        id=product.id,
        name=product.name,
        description=product.description,
        price=Money(amount=amount, currency=product.currency),
        stock=product.stock,
        image_url=get_object_storage().build_public_url(product.image_key),
        tags=tags,
    )


async def get_storefront_info(
    session: AsyncSession,
    organization_id: UUID,
) -> StorefrontInfoPublic:
    organization = await require_seller_organization(session, organization_id)
    return StorefrontInfoPublic(
        organization_id=organization.id,
        name=organization.name,
    )


async def list_storefront_products(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    tag_id: UUID | None = None,
) -> PageResult[Product]:
    await require_seller_organization(session, seller_organization_id)
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
    await require_seller_organization(session, seller_organization_id)
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
    await require_seller_organization(session, seller_organization_id)
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


async def checkout_storefront(
    session: AsyncSession,
    seller_organization_id: UUID,
    data: StorefrontCheckoutCreate,
) -> StorefrontCheckoutPublic:
    await require_seller_organization(session, seller_organization_id)
    actor = await resolve_storefront_actor(session, seller_organization_id)

    customer = await seller_customer_service.register_customer(
        session,
        seller_organization_id,
        CustomerCreate(
            name=data.name,
            ci=data.ci,
            phone=data.phone,
            address=data.address,
        ),
    )

    order = await seller_order_service.create_order(
        session,
        actor,
        seller_organization_id,
        OrderCreate(
            customer_id=customer.id,
            items=[
                OrderItemCreate(
                    product_id=item.product_id,
                    quantity=item.quantity,
                )
                for item in data.items
            ],
        ),
    )

    items = getattr(order, "items", []) or []
    messaging = getattr(order, "messaging", []) or []
    totals = getattr(order, "totals", None) or compute_order_totals(items, messaging)

    checkout_items: list[StorefrontCheckoutItemPublic] = []
    for item in items:
        unit = Money(amount=item.seller_provider_price, currency=item.currency)
        checkout_items.append(
            StorefrontCheckoutItemPublic(
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=unit,
                line_total=Money(
                    amount=item.seller_provider_price * item.quantity,
                    currency=item.currency,
                ),
            )
        )

    return StorefrontCheckoutPublic(
        order_id=order.id,
        code=order.code,
        items=checkout_items,
        totals=list(totals.total),
    )
