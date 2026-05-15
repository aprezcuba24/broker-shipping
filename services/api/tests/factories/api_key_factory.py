from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.api_keys import generate_api_key
from app.modules.organization.models import ApiKey


async def create_api_key_row(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    name: str = "integration",
) -> tuple[str, dict]:
    org_uuid = organization_id if isinstance(organization_id, UUID) else UUID(str(organization_id))
    raw, prefix, secret_hash = generate_api_key()
    entity = ApiKey(
        organization_id=org_uuid,
        name=name,
        prefix=prefix,
        secret_hash=secret_hash,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return raw, entity.model_dump(mode="json")


class ApiKeyFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def build(self, *, organization_id: UUID | str, name: str = "default") -> tuple[str, dict]:
        return await create_api_key_row(self._session, organization_id=organization_id, name=name)
