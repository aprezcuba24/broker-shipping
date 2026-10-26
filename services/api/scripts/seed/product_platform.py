from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.utils import utc_now
from app.models.organization import Organization
from app.models.platform import OrganizationPlatformProduct, PlatformProduct
from app.types import ALL_PLATFORM_PRODUCT_CODES


async def register_products_platform(org: Organization, session: AsyncSession) -> None:
    for code in ALL_PLATFORM_PRODUCT_CODES:
        product = await session.execute(select(PlatformProduct).where(PlatformProduct.code == code))
        product = product.scalar_one_or_none()
        if product is not None:
            session.add(OrganizationPlatformProduct(
                organization_id=org.id,
                platform_product_id=product.id,
                enabled=True,
                granted_at=utc_now(),
            ))
    await session.flush()