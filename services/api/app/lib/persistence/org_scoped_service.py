from collections.abc import Sequence
from typing import Generic, TypeVar
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel

from app.lib.persistence.filtering import FilterSpec
from app.lib.persistence.organization_entity_model import OrganizationEntityModel

O = TypeVar("O", bound=OrganizationEntityModel)


class OrgScopedServiceMixin(Generic[O]):
    @classmethod
    def list_filter_spec(cls) -> FilterSpec[O] | None:
        return None

    async def list_for_organization(
        self,
        organization_id: UUID,
        *,
        filters: BaseModel | None = None,
    ) -> Sequence[O]:
        entities = await self._repo.list_by_organization(  # type: ignore[attr-defined]
            organization_id,
            filters=filters,
            filter_spec=type(self).list_filter_spec(),
        )
        await self.on_list(entities)
        return entities

    async def get_for_organization(
        self,
        entity_id: UUID,
        organization_id: UUID,
    ) -> O | None:
        entity = await self._repo.get_by_id_for_organization(entity_id, organization_id)  # type: ignore[attr-defined]
        await self.on_get(entity)
        return entity

    async def get_or_404_for_organization(
        self,
        entity_id: UUID,
        organization_id: UUID,
        *,
        detail: str = "Not found",
    ) -> O:
        entity = await self.get_for_organization(entity_id, organization_id)
        if entity is None:
            raise HTTPException(status_code=404, detail=detail)
        return entity
