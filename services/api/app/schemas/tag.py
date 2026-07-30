from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import NonEmptyStr


class TagCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    is_active: bool = True


class TagUpdate(TagCreate):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class TagPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    is_active: bool
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None
