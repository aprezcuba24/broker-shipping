from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.persistence import get_entity
from app.lib.utils import utc_now
from app.models.organization.provider_settings import ProviderSettings
from app.schemas.messaging import MessagingSettingsPublic, MessagingSettingsUpdate


async def get_messaging_settings(
    session: AsyncSession,
    organization_id: UUID,
) -> MessagingSettingsPublic:
    settings = await get_entity(
        session,
        ProviderSettings,
        required=False,
        organization_id=organization_id,
    )
    if settings is None:
        return MessagingSettingsPublic(accepts_unconfigured_neighborhoods=False)
    return MessagingSettingsPublic(
        accepts_unconfigured_neighborhoods=settings.accepts_unconfigured_neighborhoods,
    )


async def update_messaging_settings(
    session: AsyncSession,
    organization_id: UUID,
    data: MessagingSettingsUpdate,
) -> MessagingSettingsPublic:
    settings = await get_entity(
        session,
        ProviderSettings,
        required=False,
        organization_id=organization_id,
    )
    if settings is None:
        settings = ProviderSettings(
            organization_id=organization_id,
            accepts_unconfigured_neighborhoods=data.accepts_unconfigured_neighborhoods,
        )
    else:
        settings.accepts_unconfigured_neighborhoods = (
            data.accepts_unconfigured_neighborhoods
        )
        settings.updated_at = utc_now()
    session.add(settings)
    await session.commit()
    await session.refresh(settings)
    return MessagingSettingsPublic(
        accepts_unconfigured_neighborhoods=settings.accepts_unconfigured_neighborhoods,
    )


async def load_accepts_unconfigured_by_provider(
    session: AsyncSession,
    provider_ids: list[UUID],
) -> dict[UUID, bool]:
    """Return accepts_unconfigured flag per provider. Missing row → False."""
    if not provider_ids:
        return {}

    result = await session.execute(
        select(ProviderSettings).where(
            col(ProviderSettings.organization_id).in_(provider_ids)
        )
    )
    found = {
        settings.organization_id: settings.accepts_unconfigured_neighborhoods
        for settings in result.scalars().all()
    }
    return {provider_id: found.get(provider_id, False) for provider_id in provider_ids}
