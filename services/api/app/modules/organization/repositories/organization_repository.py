from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.organization.models import Organization


class OrganizationRepository(Resource[Organization]):
    async def list_by_ids(self, ids: Sequence[UUID]) -> list[Organization]:
        if not ids:
            return []
        result = await self._session.execute(select(Organization).where(Organization.id.in_(ids)))
        return list(result.scalars().all())
