from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import NonEmptyStr
from app.schemas.tag import TagPublic


class ProductCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    tag_ids: list[UUID] = Field(default_factory=list)


class ProductUpdate(ProductCreate):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    tag_ids: list[UUID] | None = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None
    tags: list[TagPublic] = Field(default_factory=list)
