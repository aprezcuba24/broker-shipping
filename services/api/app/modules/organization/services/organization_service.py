from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any
from uuid import UUID

from fastapi import HTTPException

from app.lib.event_dispatcher import EventDispatcher
from app.lib.persistence import BaseService
from app.lib.post_commit import PostCommitQueue
from app.lib.utils import utc_now
from app.modules.organization.models import Organization
from app.modules.organization.repositories import (
    OrganizationRepository,
    UserOrganizationRepository,
)


class OrganizationService(BaseService[Organization]):
    def __init__(
        self,
        repository: OrganizationRepository,
        user_organization_repository: UserOrganizationRepository,
        dispatcher: EventDispatcher,
        post_commit: PostCommitQueue,
    ) -> None:
        super().__init__(repository, dispatcher, post_commit)
        self._user_org_repo = user_organization_repository

    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Organization.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Organization.model_fields.keys()) - Organization.IMMUTABLE_FIELDS

    async def create_for_user(self, entity: Organization, user_id: UUID) -> Organization:
        org = await self._repo.create(entity)
        await self._user_org_repo.add_membership(user_id, org.id)
        return org

    async def list_for_user(self, user_id: UUID) -> Sequence[Organization]:
        ids = await self._user_org_repo.list_organization_ids(user_id)
        return await self._repo.list_by_ids(ids)

    async def _require_member_active_org(
        self,
        organization_id: UUID,
        user_id: UUID,
    ) -> Organization:
        if not await self._user_org_repo.is_member(user_id, organization_id):
            raise HTTPException(status_code=403, detail="Forbidden")
        org = await self._repo.get_active_by_id(organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    async def update_for_user(
        self,
        organization_id: UUID,
        user_id: UUID,
        payload: Mapping[str, Any],
    ) -> Organization:
        await self._require_member_active_org(organization_id, user_id)
        updated = await self.patch(
            organization_id,
            payload,
            allowed_keys=self.patch_allowed_keys(),
        )
        if updated is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        return updated

    async def delete_for_user(self, organization_id: UUID, user_id: UUID) -> None:
        await self._require_member_active_org(organization_id, user_id)
        if await self._repo.has_dependencies(organization_id):
            await self.patch(
                organization_id,
                {"deleted_at": utc_now()},
                allowed_keys=frozenset({"deleted_at"}),
            )
            return
        await self._user_org_repo.delete_memberships_for_organization(organization_id)
        org = await self._repo.get_by_id(organization_id)
        if org is not None:
            await self._repo.delete(org)
