from fastapi import APIRouter

from . import category, provider_product, seller_product

router = APIRouter()
router.include_router(provider_product.router, prefix="/provider")
router.include_router(seller_product.router, prefix="/seller")
router.include_router(category.router, prefix="/categories")
