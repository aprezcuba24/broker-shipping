from fastapi import APIRouter

from . import product

router = APIRouter()
router.include_router(product.router)
