from datetime import datetime, timezone
from typing import ClassVar
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Product(SQLModel, table=True):
    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = frozenset({"id", "created_at"})
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=_utc_now)
