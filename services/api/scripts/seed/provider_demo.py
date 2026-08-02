"""Seed a demo provider organization with one user and two products."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.passwords import hash_password
from app.lib.utils import utc_now
from app.models.order.enums import Currency
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.user_organization import UserOrganization
from app.models.product.product import Product
from app.models.user.user import User

NAME = "provider_demo"

USER_EMAIL = "provider@example.com"
USER_PASSWORD = "password123"
USER_NAME = "Provider Demo"
ORG_NAME = "Demo Provider"
PRODUCT_NAME_CUP = "Producto demo CUP"
PRODUCT_NAME_USD = "Producto demo USD"


async def run(session: AsyncSession) -> None:
    user = User(
        name=USER_NAME,
        email=USER_EMAIL,
        password_hash=hash_password(USER_PASSWORD),
        is_super_admin=False,
        email_verified_at=utc_now(),
    )
    session.add(user)
    await session.flush()

    org = Organization(name=ORG_NAME, type=OrganizationType.provider)
    session.add(org)
    await session.flush()

    session.add(
        UserOrganization(
            user_id=user.id,
            organization_id=org.id,
            is_active=True,
        ),
    )
    session.add_all(
        [
            Product(
                name=PRODUCT_NAME_CUP,
                organization_id=org.id,
                price=10000,
                commission=500,
                currency=Currency.cup,
            ),
            Product(
                name=PRODUCT_NAME_USD,
                organization_id=org.id,
                price=2500,
                commission=250,
                currency=Currency.usd,
            ),
        ],
    )
    await session.flush()

    print(f"  [{NAME}] user={USER_EMAIL} password={USER_PASSWORD}")
    print(f"  [{NAME}] org={ORG_NAME} id={org.id}")
    print(f"  [{NAME}] products={PRODUCT_NAME_CUP}, {PRODUCT_NAME_USD}")
