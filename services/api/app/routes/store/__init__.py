from fastapi import APIRouter

from . import checkout, locations, organization, products

router = APIRouter(prefix="/storefront", tags=["storefront"])
router.include_router(organization.router)
router.include_router(products.router)
router.include_router(checkout.router)
router.include_router(locations.router)

__all__ = ["checkout", "locations", "organization", "products", "router"]
