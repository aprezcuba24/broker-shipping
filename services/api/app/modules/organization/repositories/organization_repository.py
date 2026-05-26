from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select

from app.lib.persistence import Resource
from app.modules.organization.models import ApiKey, Organization
from app.modules.products.models import Category, Product


class OrganizationRepository(Resource[Organization]):
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

    async def get_active_by_id(self, organization_id: UUID) -> Organization | None:
        result = await self._session.execute(
            select(Organization).where(
                Organization.id == organization_id,
                Organization.deleted_at.is_(None),  # type: ignore[union-attr]
            ),
        )
        return result.scalar_one_or_none()

    async def has_dependencies(self, organization_id: UUID) -> bool:
        for model in (Product, Category, ApiKey):
            result = await self._session.execute(
                select(func.count())
                .select_from(model)
                .where(model.organization_id == organization_id),  # type: ignore[arg-type]
            )
            if (result.scalar_one() or 0) > 0:
                return True
        return False
