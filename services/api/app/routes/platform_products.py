from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence import get_entity
from app.lib.security.access import ensure_organization_access
from app.lib.security.deps import CurrentUserDep, SuperAdminDep
from app.models.organization.organization import Organization
from app.schemas.platform_product import (
    OrganizationPlatformProductPublic,
    OrganizationPlatformProductsReplace,
    PlatformProductPublic,
)
from app.services import platform_product as platform_product_service

router = APIRouter(tags=["platform-products"])


@router.get("/platform-products", response_model=list[PlatformProductPublic])
async def list_platform_product_catalog(
    _user: CurrentUserDep,
    session: SessionDep,
) -> list[PlatformProductPublic]:
    catalog = await platform_product_service.list_catalog(session)
    return [PlatformProductPublic.model_validate(row) for row in catalog]


@router.get(
    "/organizations/{organization_id}/platform-products",
    response_model=list[OrganizationPlatformProductPublic],
)
async def list_organization_platform_products(
    organization_id: UUID,
    user: CurrentUserDep,
    session: SessionDep,
) -> list[OrganizationPlatformProductPublic]:
    await ensure_organization_access(
        session,
        user,
        organization_id=organization_id,
    )
    rows = await platform_product_service.list_entitlements_for_organization(
        session,
        organization_id,
    )
    return [
        OrganizationPlatformProductPublic(
            code=product.code,
            name=product.name,
            description=product.description,
            enabled=enabled,
        )
        for product, enabled in rows
    ]


@router.put(
    "/organizations/{organization_id}/platform-products",
    response_model=list[OrganizationPlatformProductPublic],
)
async def replace_organization_platform_products(
    organization_id: UUID,
    body: OrganizationPlatformProductsReplace,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> list[OrganizationPlatformProductPublic]:
    await get_entity(session, Organization, id=organization_id)
    await platform_product_service.replace_enabled_products_for_organization(
        session,
        organization_id,
        codes=body.codes,
    )
    rows = await platform_product_service.list_entitlements_for_organization(
        session,
        organization_id,
    )
    return [
        OrganizationPlatformProductPublic(
            code=product.code,
            name=product.name,
            description=product.description,
            enabled=enabled,
        )
        for product, enabled in rows
    ]
