from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.facebook.facebook_group import FacebookGroup


async def create_facebook_group(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    name: str | None = None,
    facebook_id: str | None = None,
) -> dict:
    oid = (
        organization_id
        if isinstance(organization_id, UUID)
        else UUID(str(organization_id))
    )
    entity = FacebookGroup(
        name=name if name is not None else "Factory group",
        facebook_id=facebook_id if facebook_id is not None else "1234567890",
        organization_id=oid,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class FacebookGroupFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        organization_id: UUID | str,
        name: str | None = None,
        facebook_id: str | None = None,
    ) -> dict:
        self._n += 1
        return await create_facebook_group(
            self._session,
            organization_id=organization_id,
            name=name or f"Group-{self._n:04d}",
            facebook_id=facebook_id or f"fb-{self._n:08d}",
        )
