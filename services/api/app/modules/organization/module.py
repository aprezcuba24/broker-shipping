from fastapi import APIRouter

from app.lib import AppModule
from app.modules.organization.routes import router as domain_router


class OrganizationModule(AppModule):
    @property
    def prefix(self) -> str:
        return "/organizations"

    def get_router(self) -> APIRouter:
        return domain_router
