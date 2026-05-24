from datetime import datetime
from typing import ClassVar
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class Category(SQLModel, table=True):
    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = frozenset({"id", "created_at", "updated_at"})
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    organization_id: UUID = Field(foreign_key="organization.id", index=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime | None = Field(default=None)
