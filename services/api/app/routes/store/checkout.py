from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.security.deps import PublicSellerOrgDep
from app.schemas.storefront import (
    StorefrontCheckoutCreate,
    StorefrontCheckoutPublic,
    storefront_checkout_to_public,
)
from app.services.store import checkout as store_checkout_service

router = APIRouter()


@router.post("/checkout", response_model=StorefrontCheckoutPublic, status_code=201)
async def checkout(
    body: StorefrontCheckoutCreate,
    organization: PublicSellerOrgDep,
    session: SessionDep,
) -> StorefrontCheckoutPublic:
    order = await store_checkout_service.checkout_storefront(
        session,
        organization.id,
        body,
    )
    return storefront_checkout_to_public(order)
