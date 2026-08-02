from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.persistence import get_entity
from app.models.location.municipality import Municipality
from app.models.location.province import Province


async def list_provinces(session: AsyncSession) -> list[Province]:
    result = await session.execute(select(Province).order_by(Province.name))
    return list(result.scalars().all())


async def list_municipalities_for_province(
    session: AsyncSession,
    province_id: UUID,
) -> list[Municipality]:
    await get_entity(session, Province, id=province_id)
    result = await session.execute(
        select(Municipality)
        .where(Municipality.province_id == province_id)
        .order_by(Municipality.name)
    )
    return list(result.scalars().all())
