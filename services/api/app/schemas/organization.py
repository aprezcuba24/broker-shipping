from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.organization.enums import OrganizationType


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: OrganizationType


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class OrganizationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: OrganizationType
    created_at: datetime
    updated_at: datetime | None
