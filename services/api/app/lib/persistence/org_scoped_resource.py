from collections.abc import Sequence
from typing import TypeVar
from uuid import UUID

from sqlalchemy import select

from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.lib.persistence.resource import Resource

O = TypeVar("O", bound=OrganizationEntityModel)


class OrgScopedRepositoryMixin(Resource[O]):
    async def list_by_organization(self, organization_id: UUID) -> Sequence[O]:
        result = await self._session.execute(
            select(self._model).where(self._model.organization_id == organization_id),
        )
        return result.scalars().all()

    async def get_by_id_for_organization(
        self,
        entity_id: UUID,
        organization_id: UUID,
    ) -> O | None:
        result = await self._session.execute(
            select(self._model).where(
                self._model.id == entity_id,
                self._model.organization_id == organization_id,
            ),
        )
        return result.scalar_one_or_none()
