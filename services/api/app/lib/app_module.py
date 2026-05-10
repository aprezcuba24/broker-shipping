from abc import ABC, abstractmethod

from fastapi import APIRouter


class AppModule(ABC):
    """HTTP module entrypoint: expose a prefix and the router for this domain."""

    @property
    @abstractmethod
    def prefix(self) -> str:
        """URL prefix where this module's routes are mounted (e.g. ``/products``)."""

    @abstractmethod
    def get_router(self) -> APIRouter:
        """Return all routes owned by this module."""
