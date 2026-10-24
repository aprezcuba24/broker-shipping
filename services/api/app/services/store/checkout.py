from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.exceptions import raise_api_error
from app.models.order.order import Order
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User
from app.schemas.customer import CustomerCreate
from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.storefront import StorefrontCheckoutCreate
from app.services.customer import seller as seller_customer_service
from app.services.order import seller as seller_order_service


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


async def checkout_storefront(
    session: AsyncSession,
    seller_organization_id: UUID,
    data: StorefrontCheckoutCreate,
) -> Order:
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

    return await seller_order_service.create_order(
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
