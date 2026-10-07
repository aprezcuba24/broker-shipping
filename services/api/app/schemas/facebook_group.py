from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import FacebookGroupId, NonEmptyStr, OptionalFacebookGroupId


class FacebookGroupCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    facebook_id: FacebookGroupId = Field(max_length=2048)


class FacebookGroupUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    facebook_id: OptionalFacebookGroupId = Field(default=None, max_length=2048)


class FacebookGroupPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    facebook_id: str
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None
