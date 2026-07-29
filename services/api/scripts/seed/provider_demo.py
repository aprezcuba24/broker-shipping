"""Seed a demo provider organization with one user and one product."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.passwords import hash_password
from app.lib.utils import utc_now
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
PRODUCT_NAME = "Producto demo"


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
    session.add(
        Product(
            name=PRODUCT_NAME,
            organization_id=org.id,
        ),
    )
    await session.flush()

    print(f"  [{NAME}] user={USER_EMAIL} password={USER_PASSWORD}")
    print(f"  [{NAME}] org={ORG_NAME} id={org.id}")
    print(f"  [{NAME}] product={PRODUCT_NAME}")
