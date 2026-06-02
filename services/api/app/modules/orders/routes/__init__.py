from fastapi import APIRouter

from app.modules.orders.routes.order import router as order_router

router = APIRouter()
router.include_router(order_router)
