from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.organization.enums import OrganizationType
from app.schemas.fields import NonEmptyStr


class OrganizationCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    type: OrganizationType


class OrganizationUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)


class OrganizationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: OrganizationType
    created_at: datetime
    updated_at: datetime | None
