from collections.abc import Callable

from dishka import Provider
from fastapi import APIRouter
from sqlmodel import SQLModel

from app.lib import AppModule
from app.lib.event_dispatcher import EventDispatcher
from app.modules.user.listener import register_listeners
from app.modules.user.models import MODULE_MODELS
from app.modules.user.provider import UserProvider
from app.modules.user.routes import router as domain_router


class UserModule(AppModule):
    @property
    def prefix(self) -> str:
        return "/users"

    def get_router(self) -> APIRouter:
        return domain_router

    def get_listener_registrar(self) -> Callable[[EventDispatcher], None]:
        return register_listeners

    def get_models(self) -> tuple[type[SQLModel], ...]:
        return MODULE_MODELS

    def get_provider(self) -> Provider:
        return UserProvider()
