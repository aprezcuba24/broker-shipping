from datetime import datetime
from typing import ClassVar
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class ApiKeyBase(SQLModel):
    """Scalar fields shared by the ORM entity and API responses (never secret_hash)."""

    organization_id: UUID
    name: str = Field(max_length=255)
    prefix: str = Field(max_length=12)
    last_used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)
    revoked_at: datetime | None = Field(default=None)


class ApiKey(ApiKeyBase, table=True):
    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = frozenset(
        {"id", "organization_id", "prefix", "secret_hash", "created_at"}
    )
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organization.id", index=True)
    prefix: str = Field(max_length=12, unique=True, index=True)
    secret_hash: str = Field(max_length=64)


class ApiKeyPublic(ApiKeyBase):
    id: UUID
