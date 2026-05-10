from fastapi import APIRouter

from app.lib import AppModule
from app.modules.products.routes import router as domain_router


class ProductsModule(AppModule):
    @property
    def prefix(self) -> str:
        return "/products"

    def get_router(self) -> APIRouter:
        return domain_router
