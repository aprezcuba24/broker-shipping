from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location.municipality import Municipality
from app.models.location.province import Province


async def create_province(
    session: AsyncSession,
    *,
    name: str | None = None,
) -> dict:
    entity = Province(name=name if name is not None else "Factory Province")
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


async def create_municipality(
    session: AsyncSession,
    *,
    province_id: UUID | str,
    name: str | None = None,
) -> dict:
    pid = province_id if isinstance(province_id, UUID) else UUID(str(province_id))
    entity = Municipality(
        name=name if name is not None else "Factory Municipality",
        province_id=pid,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class LocationFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build_province(self, *, name: str | None = None) -> dict:
        self._n += 1
        return await create_province(
            self._session,
            name=name or f"Province-{self._n:04d}",
        )

    async def build_municipality(
        self,
        *,
        province_id: UUID | str,
        name: str | None = None,
    ) -> dict:
        self._n += 1
        return await create_municipality(
            self._session,
            province_id=province_id,
            name=name or f"Municipality-{self._n:04d}",
        )
