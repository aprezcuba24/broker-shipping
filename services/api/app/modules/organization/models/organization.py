from datetime import datetime
from typing import ClassVar

from sqlmodel import Field

from app.lib.persistence import EntityModel


class Organization(EntityModel, table=True):
    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = EntityModel.IMMUTABLE_FIELDS | frozenset(
        {"deleted_at"},
    )

    name: str = Field(max_length=255)
    deleted_at: datetime | None = Field(default=None)
