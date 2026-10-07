from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Self
from uuid import UUID

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    ValidationInfo,
    model_validator,
)

from app.lib.storage.deps import get_object_storage
from app.lib.storage.keys import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    validate_ads_message_photo_key,
)
from app.models.ads.ads_message import AdsMessage
from app.schemas.fields import NonEmptyStr


def _allowed_image_content_type(value: str) -> str:
    if value not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValueError("Unsupported image content type")
    return value


ImageContentType = Annotated[
    str,
    AfterValidator(_allowed_image_content_type),
    Field(json_schema_extra={"enum": sorted(ALLOWED_IMAGE_CONTENT_TYPES)}),
]


class AdsMessageCreate(BaseModel):
    title: NonEmptyStr = Field(max_length=255)
    description: NonEmptyStr


class AdsMessageUpdate(BaseModel):
    title: NonEmptyStr | None = Field(default=None, max_length=255)
    description: NonEmptyStr | None = None


class AdsMessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    code: str
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None
    photo_url: str | None = None


class AdsMessagePhotoPresignRequest(BaseModel):
    content_type: ImageContentType


class AdsMessagePhotoPresignResponse(BaseModel):
    upload_url: str
    image_key: str
    headers: dict[str, str]
    expires_in: int


class AdsMessagePhotoConfirmRequest(BaseModel):
    image_key: NonEmptyStr = Field(max_length=512)

    @model_validator(mode="after")
    def validate_photo_key_for_ads_message(self, info: ValidationInfo) -> Self:
        context = info.context or {}
        organization_id = context.get("organization_id")
        ads_message_id = context.get("ads_message_id")
        if organization_id is None or ads_message_id is None:
            return self
        if not validate_ads_message_photo_key(
            organization_id,
            ads_message_id,
            self.image_key,
        ):
            raise ValueError("Invalid image key for this ads message")
        return self

    @classmethod
    def for_ads_message(
        cls,
        data: AdsMessagePhotoConfirmRequest | dict[str, Any],
        *,
        organization_id: UUID,
        ads_message_id: UUID,
    ) -> AdsMessagePhotoConfirmRequest:
        payload = data.model_dump() if isinstance(data, BaseModel) else data
        return cls.model_validate(
            payload,
            context={
                "organization_id": organization_id,
                "ads_message_id": ads_message_id,
            },
        )


def ads_message_to_public(message: AdsMessage) -> AdsMessagePublic:
    return AdsMessagePublic(
        id=message.id,
        title=message.title,
        description=message.description,
        code=message.code,
        organization_id=message.organization_id,
        created_at=message.created_at,
        updated_at=message.updated_at,
        photo_url=get_object_storage().build_public_url(message.photo_key),
    )
