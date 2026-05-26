from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.organization.models import Organization


class OrganizationRepository(Resource[Organization]):
    async def get_by_id(self, entity_id: UUID) -> Organization | None:
        result = await self._session.execute(
            select(Organization).where(
                Organization.id == entity_id,
                Organization.deleted_at.is_(None),  # type: ignore[union-attr]
            ),
        )
        return result.scalar_one_or_none()

    async def list_by_ids(self, ids: Sequence[UUID]) -> list[Organization]:
        if not ids:
            return []
        result = await self._session.execute(
            select(Organization).where(
                Organization.id.in_(ids),
                Organization.deleted_at.is_(None),  # type: ignore[union-attr]
            ),
        )
        return list(result.scalars().all())
