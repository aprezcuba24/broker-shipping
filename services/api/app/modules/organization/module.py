from collections.abc import Callable

from fastapi import APIRouter

from app.lib import AppModule
from app.lib.event_dispatcher import EventDispatcher
from app.modules.organization.listener import register_listeners
from app.modules.organization.routes import router as domain_router


class OrganizationModule(AppModule):
    @property
    def prefix(self) -> str:
        return "/organizations"

    def get_router(self) -> APIRouter:
        return domain_router

    def get_listener_registrar(self) -> Callable[[EventDispatcher], None]:
        return register_listeners
