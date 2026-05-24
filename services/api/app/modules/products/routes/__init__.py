from fastapi import APIRouter

from . import category, product

router = APIRouter()
router.include_router(product.router)
router.include_router(category.router, prefix="/categories")
