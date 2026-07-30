from fastapi import APIRouter

from app.routes import (
    api_keys,
    demo,
    health,
    products_provider,
    products_seller,
    tags_provider,
    tags_seller,
    users,
)
from app.routes.organization import (
    organizations,
    organizations_provider,
    organizations_seller,
)

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(demo.router, prefix="/demo", tags=["demo"])
router.include_router(users.router)
router.include_router(api_keys.router)
router.include_router(products_provider.router)
router.include_router(products_seller.router)
router.include_router(tags_provider.router)
router.include_router(tags_seller.router)
router.include_router(organizations.router)
router.include_router(organizations_provider.router)
router.include_router(organizations_seller.router)
