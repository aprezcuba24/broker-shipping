from fastapi import APIRouter

from app.modules.orders.routes.customer import router as customer_router
from app.modules.orders.routes.order import router as order_router

router = APIRouter()
router.include_router(customer_router, prefix="/customers")
router.include_router(order_router)
