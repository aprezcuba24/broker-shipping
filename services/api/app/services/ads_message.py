from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, or_, select

from app.lib.persistence import get_entity
from app.lib.persistence.apply_update import apply_partial_update
from app.lib.persistence.pagination import paginate
from app.lib.public_code import generate_public_code
from app.lib.storage.deps import get_object_storage
from app.models.ads.ads_message import AdsMessage
from app.schemas.ads_message import AdsMessageCreate, AdsMessageUpdate
from app.schemas.pagination import PageResult, PaginationParams

_PUBLIC_CODE_ATTEMPTS = 16


async def _allocate_code(session: AsyncSession) -> str:
    for _ in range(_PUBLIC_CODE_ATTEMPTS):
        code = generate_public_code()
        existing = await session.scalar(
            select(AdsMessage.id).where(AdsMessage.code == code).limit(1)
        )
        if existing is None:
            return code
    raise RuntimeError("Unable to allocate unique ads message code")


async def list_ads_messages_for_organization(
    session: AsyncSession,
    organization_id: UUID,
    *,
    pagination: PaginationParams,
    title: str | None = None,
) -> PageResult[AdsMessage]:
    stmt = select(AdsMessage).where(AdsMessage.organization_id == organization_id)
    if title:
        term = title.strip()
        if term:
            stmt = stmt.where(
                or_(
                    col(AdsMessage.title).ilike(f"%{term}%"),
                    col(AdsMessage.code).ilike(f"%{term}%"),
                )
            )
    stmt = stmt.order_by(col(AdsMessage.created_at).desc(), AdsMessage.id)
    return await paginate(session, stmt, pagination)


async def get_ads_message_for_organization(
    session: AsyncSession,
    ads_message_id: UUID,
    organization_id: UUID,
) -> AdsMessage:
    return await get_entity(
        session,
        AdsMessage,
        id=ads_message_id,
        organization_id=organization_id,
    )


async def create_ads_message(
    session: AsyncSession,
    organization_id: UUID,
    data: AdsMessageCreate,
) -> AdsMessage:
    message = AdsMessage(
        title=data.title,
        description=data.description,
        organization_id=organization_id,
        code=await _allocate_code(session),
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def update_ads_message(
    session: AsyncSession,
    ads_message_id: UUID,
    organization_id: UUID,
    data: AdsMessageUpdate,
) -> AdsMessage:
    message = await get_ads_message_for_organization(
        session,
        ads_message_id,
        organization_id,
    )
    apply_partial_update(message, data)
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def delete_ads_message(
    session: AsyncSession,
    ads_message_id: UUID,
    organization_id: UUID,
) -> None:
    message = await get_ads_message_for_organization(
        session,
        ads_message_id,
        organization_id,
    )
    if message.photo_key:
        await get_object_storage().delete_object(message.photo_key)
    await session.delete(message)
    await session.commit()
