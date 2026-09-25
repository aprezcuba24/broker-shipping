from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class EntityUpdated(Generic[T]):
    """Base event for entity create/update with before/after snapshots."""

    new: T
    previous: T | None = None
