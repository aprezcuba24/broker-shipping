from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import NonEmptyStr, OptionalStrippedStr


class ApiKeyCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    description: OptionalStrippedStr = Field(default=None, max_length=1024)


class ApiKeyPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    created_by_user_id: UUID
    prefix: str
    last_used_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    revoked_at: datetime | None


class ApiKeyCreatedResponse(ApiKeyPublic):
    raw_key: str
