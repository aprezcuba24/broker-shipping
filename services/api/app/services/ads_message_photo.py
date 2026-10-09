from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.storage.deps import get_object_storage
from app.lib.storage.keys import (
    PRESIGNED_PUT_EXPIRES_SECONDS,
    ads_message_photo_key,
    extension_for_content_type,
)
from app.models.ads.ads_message import AdsMessage
from app.schemas.ads_message import (
    AdsMessagePhotoConfirmRequest,
    AdsMessagePhotoPresignRequest,
    AdsMessagePhotoPresignResponse,
)
from app.services import ads_message as ads_message_service


async def presign_ads_message_photo_upload(
    session: AsyncSession,
    ads_message_id: UUID,
    organization_id: UUID,
    data: AdsMessagePhotoPresignRequest,
) -> AdsMessagePhotoPresignResponse:
    message = await ads_message_service.get_ads_message_for_organization(
        session,
        ads_message_id,
        organization_id,
    )
    extension = extension_for_content_type(data.content_type)
    image_key = ads_message_photo_key(organization_id, message.id, extension)
    storage = get_object_storage()
    presigned = await storage.generate_presigned_put(
        key=image_key,
        content_type=data.content_type,
        expires_in=PRESIGNED_PUT_EXPIRES_SECONDS,
    )
    return AdsMessagePhotoPresignResponse(
        upload_url=presigned.upload_url,
        image_key=image_key,
        headers=presigned.headers,
        expires_in=presigned.expires_in,
    )


async def confirm_ads_message_photo(
    session: AsyncSession,
    ads_message_id: UUID,
    organization_id: UUID,
    data: AdsMessagePhotoConfirmRequest,
) -> AdsMessage:
    message = await ads_message_service.get_ads_message_for_organization(
        session,
        ads_message_id,
        organization_id,
    )
    storage = get_object_storage()
    previous_key = message.photo_key
    if previous_key and previous_key != data.image_key:
        await storage.delete_object(previous_key)
    message.photo_key = data.image_key
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def delete_ads_message_photo(
    session: AsyncSession,
    ads_message_id: UUID,
    organization_id: UUID,
) -> None:
    message = await ads_message_service.get_ads_message_for_organization(
        session,
        ads_message_id,
        organization_id,
    )
    if message.photo_key:
        await get_object_storage().delete_object(message.photo_key)
    message.photo_key = None
    session.add(message)
    await session.commit()
