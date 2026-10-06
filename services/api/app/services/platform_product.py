from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.exceptions import raise_api_error
from app.lib.utils import utc_now
from app.models.platform.organization_platform_product import OrganizationPlatformProduct
from app.models.platform.platform_product import PlatformProduct
from app.types import (
    DEFAULT_PLATFORM_PRODUCT_CODES,
    PLATFORM_PRODUCT_DISPLAY_NAMES,
    PlatformProductCode,
)

CATALOG_ROWS: tuple[tuple[PlatformProductCode, str, str | None], ...] = (
    (
        PlatformProductCode.phone_blacklist,
        "Lista negra",
        "Consulta y reporte de teléfonos en lista negra.",
    ),
    (
        PlatformProductCode.provider_management,
        "Gestión de productos de proveedores",
        "Catálogo, pedidos, comisiones y operación comercial.",
    ),
    (
        PlatformProductCode.facebook_publishing,
        "Publicación en Facebook",
        "Publicación de mensajes en grupos de Facebook (futuro).",
    ),
)


def product_display_name(code: PlatformProductCode) -> str:
    return PLATFORM_PRODUCT_DISPLAY_NAMES.get(code, code.value)


async def ensure_catalog_seeded(session: AsyncSession) -> None:
    for code, name, description in CATALOG_ROWS:
        existing = await session.execute(
            select(PlatformProduct).where(PlatformProduct.code == code)
        )
        if existing.scalar_one_or_none() is not None:
            continue
        session.add(
            PlatformProduct(code=code, name=name, description=description),
        )
    await session.commit()


async def get_platform_product_by_code(
    session: AsyncSession,
    code: PlatformProductCode,
) -> PlatformProduct | None:
    result = await session.execute(
        select(PlatformProduct).where(PlatformProduct.code == code)
    )
    return result.scalar_one_or_none()


async def organization_has_enabled_product(
    session: AsyncSession,
    organization_id: UUID,
    code: PlatformProductCode,
) -> bool:
    result = await session.execute(
        select(OrganizationPlatformProduct.enabled)
        .join(
            PlatformProduct,
            PlatformProduct.id == OrganizationPlatformProduct.platform_product_id,
        )
        .where(
            OrganizationPlatformProduct.organization_id == organization_id,
            PlatformProduct.code == code,
            OrganizationPlatformProduct.enabled.is_(True),
        )
    )
    row = result.scalar_one_or_none()
    return row is True


async def ensure_organization_has_product(
    session: AsyncSession,
    organization_id: UUID,
    code: PlatformProductCode,
) -> None:
    if await organization_has_enabled_product(session, organization_id, code):
        return
    raise_api_error(
        "product_not_enabled",
        product_name=product_display_name(code),
    )


async def filter_organization_ids_with_product(
    session: AsyncSession,
    organization_ids: list[UUID],
    code: PlatformProductCode,
) -> list[UUID]:
    if not organization_ids:
        return []
    result = await session.execute(
        select(OrganizationPlatformProduct.organization_id)
        .join(
            PlatformProduct,
            PlatformProduct.id == OrganizationPlatformProduct.platform_product_id,
        )
        .where(
            col(OrganizationPlatformProduct.organization_id).in_(organization_ids),
            PlatformProduct.code == code,
            OrganizationPlatformProduct.enabled.is_(True),
        )
    )
    allowed = set(result.scalars().all())
    return [org_id for org_id in organization_ids if org_id in allowed]


async def grant_default_products_for_organization(
    session: AsyncSession,
    organization_id: UUID,
) -> None:
    await grant_products_for_organization(
        session,
        organization_id,
        codes=list(DEFAULT_PLATFORM_PRODUCT_CODES),
    )


async def grant_products_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    codes: list[PlatformProductCode],
) -> None:
    for code in codes:
        product = await get_platform_product_by_code(session, code)
        if product is None:
            raise_api_error("not_found")
        existing = await session.execute(
            select(OrganizationPlatformProduct).where(
                OrganizationPlatformProduct.organization_id == organization_id,
                OrganizationPlatformProduct.platform_product_id == product.id,
            )
        )
        row = existing.scalar_one_or_none()
        if row is None:
            session.add(
                OrganizationPlatformProduct(
                    organization_id=organization_id,
                    platform_product_id=product.id,
                    enabled=True,
                    granted_at=utc_now(),
                )
            )
        elif not row.enabled:
            row.enabled = True
            row.granted_at = utc_now()
            session.add(row)
    await session.commit()


async def replace_enabled_products_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    codes: list[PlatformProductCode],
) -> None:
    catalog = await list_catalog(session)
    code_set = set(codes)
    for product in catalog:
        existing = await session.execute(
            select(OrganizationPlatformProduct).where(
                OrganizationPlatformProduct.organization_id == organization_id,
                OrganizationPlatformProduct.platform_product_id == product.id,
            )
        )
        row = existing.scalar_one_or_none()
        should_enable = product.code in code_set
        if should_enable:
            if row is None:
                session.add(
                    OrganizationPlatformProduct(
                        organization_id=organization_id,
                        platform_product_id=product.id,
                        enabled=True,
                        granted_at=utc_now(),
                    )
                )
            elif not row.enabled:
                row.enabled = True
                row.granted_at = utc_now()
                session.add(row)
        elif row is not None and row.enabled:
            row.enabled = False
            session.add(row)
    await session.commit()


async def list_catalog(session: AsyncSession) -> list[PlatformProduct]:
    result = await session.execute(
        select(PlatformProduct).order_by(PlatformProduct.name)
    )
    return list(result.scalars().all())


async def list_entitlements_for_organization(
    session: AsyncSession,
    organization_id: UUID,
) -> list[tuple[PlatformProduct, bool]]:
    catalog = await list_catalog(session)
    if not catalog:
        return []

    result = await session.execute(
        select(OrganizationPlatformProduct).where(
            OrganizationPlatformProduct.organization_id == organization_id,
            OrganizationPlatformProduct.enabled.is_(True),
        )
    )
    enabled_ids = {row.platform_product_id for row in result.scalars().all()}
    return [(product, product.id in enabled_ids) for product in catalog]
