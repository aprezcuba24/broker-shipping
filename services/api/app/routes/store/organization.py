from fastapi import APIRouter

from app.lib.security.deps import PublicSellerOrgDep
from app.schemas.storefront import StorefrontInfoPublic
from app.services.store import organization as store_organization_service

router = APIRouter()


@router.get("/", response_model=StorefrontInfoPublic)
async def get_storefront(
    organization: PublicSellerOrgDep,
) -> StorefrontInfoPublic:
    return store_organization_service.get_storefront_info(organization)
