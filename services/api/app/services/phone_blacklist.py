from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.exceptions import raise_api_error
from app.lib.normalize import normalize_phone
from app.lib.utils import utc_now
from app.models.customer.phone_blacklist import PhoneBlacklist
from app.schemas.phone_blacklist import (
    PhoneBlacklistCreate,
    PhoneBlacklistStatusPublic,
)
from app.types import PhoneBlacklistStatus


async def get_active_entry(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phone: str,
) -> PhoneBlacklist | None:
    result = await session.execute(
        select(PhoneBlacklist).where(
            PhoneBlacklist.organization_id == organization_id,
            PhoneBlacklist.phone == phone,
            PhoneBlacklist.withdrawn_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def get_status_for_phone(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phone: str,
) -> PhoneBlacklistStatusPublic:
    normalized = normalize_phone(phone)
    if not normalized:
        raise_api_error("validation_error")

    own = await get_active_entry(
        session,
        organization_id=organization_id,
        phone=normalized,
    )
    other_count = int(
        await session.scalar(
            select(func.count())
            .select_from(PhoneBlacklist)
            .where(
                PhoneBlacklist.phone == normalized,
                PhoneBlacklist.withdrawn_at.is_(None),
                PhoneBlacklist.organization_id != organization_id,
            )
        )
        or 0
    )

    status: PhoneBlacklistStatus
    if own is not None:
        status = "yes"
    elif other_count > 0:
        status = "reported"
    else:
        status = "no"

    return PhoneBlacklistStatusPublic(
        phone=normalized,
        status=status,
        own_entry_id=own.id if own is not None else None,
        other_count=other_count,
    )


async def add_to_blacklist(
    session: AsyncSession,
    *,
    organization_id: UUID,
    user_id: UUID,
    data: PhoneBlacklistCreate,
) -> PhoneBlacklist:
    existing = await get_active_entry(
        session,
        organization_id=organization_id,
        phone=data.phone,
    )
    if existing is not None:
        raise_api_error("conflict")

    entry = PhoneBlacklist(
        phone=data.phone,
        organization_id=organization_id,
        created_by_user_id=user_id,
        reason=data.reason,
        note=data.note,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def withdraw_own_entry(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phone: str,
) -> None:
    normalized = normalize_phone(phone)
    if not normalized:
        raise_api_error("validation_error")

    entry = await get_active_entry(
        session,
        organization_id=organization_id,
        phone=normalized,
    )
    if entry is None:
        raise_api_error("not_found")

    entry.withdrawn_at = utc_now()
    entry.updated_at = utc_now()
    session.add(entry)
    await session.commit()
