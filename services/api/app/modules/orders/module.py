from collections.abc import Callable

from dishka import Provider
from fastapi import APIRouter
from sqlmodel import SQLModel

from app.lib import AppModule
from app.lib.event_dispatcher import EventDispatcher
from app.modules.orders.listener import register_listeners
from app.modules.orders.models import MODULE_MODELS
from app.modules.orders.provider import OrdersProvider
from app.modules.orders.routes import router as domain_router


class OrdersModule(AppModule):
    @property
    def prefix(self) -> str:
        return "/orders"

    def get_router(self) -> APIRouter:
        return domain_router

    def get_listener_registrar(self) -> Callable[[EventDispatcher], None]:
        return register_listeners

    def get_models(self) -> tuple[type[SQLModel], ...]:
        return MODULE_MODELS

    def get_provider(self) -> Provider:
        return OrdersProvider()
