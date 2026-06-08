from collections.abc import Sequence
from typing import TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select

from app.lib.persistence.filtering import FilterSpec
from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.lib.persistence.resource import Resource

O = TypeVar("O", bound=OrganizationEntityModel)


class OrgScopedRepositoryMixin(Resource[O]):
    async def list_by_organization(
        self,
        organization_id: UUID,
        *,
        filters: BaseModel | None = None,
        filter_spec: FilterSpec[O] | None = None,
    ) -> Sequence[O]:
        return await self.list_filtered(
            filters=filters,
            filter_spec=filter_spec,
            where=(self._model.organization_id == organization_id,),
        )

    async def list_by_organization_ids(
        self,
        organization_ids: Sequence[UUID],
        *,
        filters: BaseModel | None = None,
        filter_spec: FilterSpec[O] | None = None,
    ) -> Sequence[O]:
        if not organization_ids:
            return []
        return await self.list_filtered(
            filters=filters,
            filter_spec=filter_spec,
            where=(self._model.organization_id.in_(organization_ids),),
        )

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

    async def get_by_id_for_organization_ids(
        self,
        entity_id: UUID,
        organization_ids: Sequence[UUID],
    ) -> O | None:
        if not organization_ids:
            return None
        result = await self._session.execute(
            select(self._model).where(
                self._model.id == entity_id,
                self._model.organization_id.in_(organization_ids),
            ),
        )
        return result.scalar_one_or_none()
