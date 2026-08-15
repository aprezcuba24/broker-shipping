from fastapi import APIRouter

from . import product_image, products_provider

router = APIRouter()
router.include_router(products_provider.router)
router.include_router(product_image.router)

__all__ = ["product_image", "products_provider", "router"]
