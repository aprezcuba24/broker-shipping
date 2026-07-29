from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import NonEmptyStr


class ProductCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)


class ProductUpdate(ProductCreate):
    name: NonEmptyStr | None = Field(default=None, max_length=255)


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None
