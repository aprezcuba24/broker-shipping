from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel

from app.lib.persistence.entity_model import EntityModel
from app.lib.utils import utc_now

T = TypeVar("T", bound=EntityModel)


def apply_partial_update(entity: T, data: BaseModel) -> T:
    """Apply fields set on ``data`` onto ``entity`` and bump ``updated_at``."""
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(entity, key, value)
    entity.updated_at = utc_now()
    return entity
