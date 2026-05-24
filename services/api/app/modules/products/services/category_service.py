from collections.abc import Mapping
from typing import Any
from uuid import UUID

from app.lib.base_service import BaseService
from app.lib.utils import utc_now
from app.modules.products.models import Category


class CategoryService(BaseService[Category]):
    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Category.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Category.model_fields.keys()) - Category.IMMUTABLE_FIELDS

    async def patch(
        self,
        entity_id: UUID,
        body: Mapping[str, Any],
        *,
        allowed_keys: frozenset[str],
    ) -> Category | None:
        data = {k: v for k, v in body.items() if k in allowed_keys}
        if not data:
            return await self.get(entity_id)
        data["updated_at"] = utc_now()
        return await self.update(entity_id, data)
