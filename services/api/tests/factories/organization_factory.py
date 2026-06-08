from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.organization.models import (
    Organization,
    OrganizationType,
    ProviderSellerLink,
    UserOrganization,
)


async def create_organization_for_user(
    session: AsyncSession,
    *,
    user_id: UUID | str,
    name: str | None = None,
    org_type: OrganizationType = OrganizationType.provider,
) -> dict:
    uid = user_id if isinstance(user_id, UUID) else UUID(str(user_id))
    entity = Organization(name=name or "Test Org", type=org_type)
    session.add(entity)
    await session.flush()
    session.add(
        UserOrganization(
            user_id=uid,
            organization_id=entity.id,
            is_active=True,
        ),
    )
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


async def link_provider_to_seller(
    session: AsyncSession,
    *,
    provider_organization_id: UUID | str,
    seller_organization_id: UUID | str,
) -> None:
    link = ProviderSellerLink(
        provider_organization_id=UUID(str(provider_organization_id)),
        seller_organization_id=UUID(str(seller_organization_id)),
        is_active=True,
    )
    session.add(link)
    await session.flush()
    await session.commit()


class OrganizationFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        user_id: UUID | str,
        name: str | None = None,
        org_type: OrganizationType = OrganizationType.provider,
    ) -> dict:
        self._n += 1
        final_name = name or f"ORG-{self._n:04d}"
        return await create_organization_for_user(
            self._session,
            user_id=user_id,
            name=final_name,
            org_type=org_type,
        )

    async def build_seller(
        self,
        *,
        user_id: UUID | str,
        name: str | None = None,
    ) -> dict:
        return await self.build(user_id=user_id, name=name, org_type=OrganizationType.seller)
