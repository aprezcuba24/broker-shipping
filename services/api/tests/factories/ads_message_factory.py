from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.public_code import generate_public_code
from app.models.ads.ads_message import AdsMessage


async def create_ads_message(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    title: str | None = None,
    description: str | None = None,
    code: str | None = None,
    photo_key: str | None = None,
) -> dict:
    oid = (
        organization_id
        if isinstance(organization_id, UUID)
        else UUID(str(organization_id))
    )
    entity = AdsMessage(
        title=title if title is not None else "Factory ad",
        description=description if description is not None else "Factory description",
        organization_id=oid,
        code=code if code is not None else generate_public_code(),
        photo_key=photo_key,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class AdsMessageFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        organization_id: UUID | str,
        title: str | None = None,
        description: str | None = None,
        code: str | None = None,
        photo_key: str | None = None,
    ) -> dict:
        self._n += 1
        return await create_ads_message(
            self._session,
            organization_id=organization_id,
            title=title or f"Ad-{self._n:04d}",
            description=description,
            code=code,
            photo_key=photo_key,
        )
