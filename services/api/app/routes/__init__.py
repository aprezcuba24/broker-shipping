from fastapi import APIRouter

from app.routes import demo, health, users

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(demo.router, prefix="/demo", tags=["demo"])
router.include_router(users.router)
