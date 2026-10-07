from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.lib.normalize import facebook_group_url
from app.models.facebook.facebook_group import FacebookGroup
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


def facebook_group_to_public(group: FacebookGroup) -> FacebookGroupPublic:
    return FacebookGroupPublic(
        id=group.id,
        name=group.name,
        facebook_id=facebook_group_url(group.facebook_id),
        organization_id=group.organization_id,
        created_at=group.created_at,
        updated_at=group.updated_at,
    )
