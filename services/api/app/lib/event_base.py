from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Event(BaseModel):
    """Base type for domain events; subclass with public fields for the payload."""


class EntityEvent(Event, Generic[T]):
    """Event carrying the full entity that was mutated.

    Subclass with the concrete model to get typed access::

        class ProductCreated(EntityEvent[Product]): ...

        event.entity  # IDE resolves as Product
    """

    entity: T
