from fastapi import APIRouter

from app.routes import demo, health

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(demo.router, prefix="/demo", tags=["demo"])
