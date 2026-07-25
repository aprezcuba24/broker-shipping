from fastapi import APIRouter

from app.routes import (
    demo,
    health,
    organizations_seller,
    products_provider,
    products_seller,
    users,
)

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(demo.router, prefix="/demo", tags=["demo"])
router.include_router(users.router)
router.include_router(products_provider.router)
router.include_router(products_seller.router)
router.include_router(organizations_seller.router)
