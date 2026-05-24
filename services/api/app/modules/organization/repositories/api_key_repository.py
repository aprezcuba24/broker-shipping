from uuid import UUID

from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.organization.models import ApiKey


class ApiKeyRepository(Resource[ApiKey]):
    async def find_active_by_prefix(self, prefix: str) -> ApiKey | None:
        result = await self._session.execute(
            select(ApiKey).where(
                ApiKey.prefix == prefix,
                ApiKey.revoked_at.is_(None),  # type: ignore[union-attr]
            ),
        )
        return result.scalar_one_or_none()

    async def list_by_organization(self, organization_id: UUID) -> list[ApiKey]:
        result = await self._session.execute(
            select(ApiKey).where(ApiKey.organization_id == organization_id),
        )
        return list(result.scalars().all())
