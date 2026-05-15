from fastapi import APIRouter

from app.modules.user.routes import user

router = APIRouter()
router.include_router(user.router)
