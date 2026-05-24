from __future__ import annotations

import secrets
from uuid import UUID

from app.lib.persistence import BaseService
from app.lib.security.api_keys import generate_api_key, hash_secret, split_raw
from app.modules.organization.models import ApiKey, ApiKeyPublic


class ApiKeyService(BaseService[ApiKey]):
    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return ApiKey.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(ApiKey.model_fields.keys()) - ApiKey.IMMUTABLE_FIELDS

    def to_api_key_public(self, entity: ApiKey) -> ApiKeyPublic:
        data = entity.model_dump(exclude={"secret_hash"}, mode="python")
        data["id"] = UUID(str(data["id"]))
        data["organization_id"] = UUID(str(data["organization_id"]))
        return ApiKeyPublic(**data)

    async def create_for_organization(self, organization_id: UUID, name: str) -> tuple[str, ApiKey]:
        raw, prefix, secret_hash = generate_api_key()
        entity = ApiKey(
            organization_id=organization_id,
            name=name,
            prefix=prefix,
            secret_hash=secret_hash,
        )
        created = await self.create(entity)
        return raw, created

    async def verify_raw(self, raw: str) -> ApiKey | None:
        parts = split_raw(raw)
        if parts is None:
            return None
        prefix, secret_plain = parts
        row = await self._repo.find_active_by_prefix(prefix)
        if row is None:
            return None
        if not secrets.compare_digest(hash_secret(secret_plain), row.secret_hash):
            return None
        return row

    async def list_for_organization(self, organization_id: UUID) -> list[ApiKey]:
        return await self._repo.list_by_organization(organization_id)

    async def revoke_key(self, api_key_id: UUID) -> ApiKey | None:
        from app.lib.utils import utc_now

        cur = await self.get(api_key_id)
        if cur is None:
            return None
        if cur.revoked_at is not None:
            return cur
        return await self.update(api_key_id, {"revoked_at": utc_now()})
