from abc import ABC, abstractmethod
from collections.abc import Callable

from dishka import Provider
from fastapi import APIRouter
from sqlmodel import SQLModel

from app.lib.event_dispatcher import EventDispatcher


class AppModule(ABC):
    """HTTP module entrypoint: expose a prefix and the router for this domain."""

    @property
    @abstractmethod
    def prefix(self) -> str:
        """URL prefix where this module's routes are mounted (e.g. ``/products``)."""

    @abstractmethod
    def get_router(self) -> APIRouter:
        """Return all routes owned by this module."""

    @abstractmethod
    def get_listener_registrar(self) -> Callable[[EventDispatcher], None]:
        """Return a function that subscribes this module's event handlers on ``dispatcher``."""

    @abstractmethod
    def get_models(self) -> tuple[type[SQLModel], ...]:
        """SQLModel table classes (``table=True``) registered in the shared metadata for this domain."""

    @abstractmethod
    def get_provider(self) -> Provider:
        """Return the Dishka provider that registers this module's DI bindings."""
