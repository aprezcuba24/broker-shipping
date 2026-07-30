from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel

from app.lib.persistence.entity_model import EntityModel
from app.lib.utils import utc_now

T = TypeVar("T", bound=EntityModel)


def apply_partial_update(
    entity: T,
    data: BaseModel,
    *,
    exclude: set[str] | None = None,
) -> T:
    """Apply fields set on ``data`` onto ``entity`` and bump ``updated_at``."""
    payload = data.model_dump(exclude_unset=True)
    if exclude:
        for key in exclude:
            payload.pop(key, None)
    for key, value in payload.items():
        setattr(entity, key, value)
    entity.updated_at = utc_now()
    return entity
