from collections.abc import Sequence
from uuid import UUID

from pydantic import BaseModel

from app.modules.organization.models import OrganizationType
from app.modules.organization.repositories.user_organization_repository import (
    UserOrganizationRepository,
)
from app.modules.products.models import Product
from app.modules.products.services.product_service_base import ProductServiceBase


class SellerProductService(ProductServiceBase):
    def __init__(
        self,
        repository,
        dispatcher,
        post_commit,
        link_service,
        user_org_repo: UserOrganizationRepository,
    ) -> None:
        super().__init__(repository, dispatcher, post_commit, link_service)
        self._user_org_repo = user_org_repo

    async def _seller_organization_ids(
        self,
        user_id: UUID,
        *,
        organization_id: UUID | None,
    ) -> list[UUID]:
        if organization_id is not None:
            return [organization_id]
        orgs = await self._user_org_repo.list_organizations_for_user(
            user_id,
            org_type=OrganizationType.seller,
        )
        return [org.id for org in orgs]

    async def _provider_ids_for_seller_orgs(self, seller_org_ids: Sequence[UUID]) -> list[UUID]:
        provider_ids: list[UUID] = []
        seen: set[UUID] = set()
        for seller_org_id in seller_org_ids:
            for provider_id in await self._link_service.list_active_provider_ids(seller_org_id):
                if provider_id not in seen:
                    seen.add(provider_id)
                    provider_ids.append(provider_id)
        return provider_ids

    async def list_for_seller_organization(
        self,
        seller_organization_id: UUID,
        *,
        filters: BaseModel | None = None,
    ) -> Sequence[Product]:
        provider_ids = await self._link_service.list_active_provider_ids(seller_organization_id)
        return await self._list_for_provider_ids(provider_ids, filters=filters)

    async def get_for_seller_organization(
        self,
        product_id: UUID,
        seller_organization_id: UUID,
        *,
        detail: str = "Product not found",
    ) -> Product:
        provider_ids = await self._link_service.list_active_provider_ids(seller_organization_id)
        return await self._get_for_provider_ids(product_id, provider_ids, detail=detail)

    async def list_accessible(
        self,
        user_id: UUID,
        *,
        organization_id: UUID | None = None,
        filters: BaseModel | None = None,
    ) -> Sequence[Product]:
        if organization_id is not None:
            return await self.list_for_seller_organization(
                organization_id,
                filters=filters,
            )
        seller_org_ids = await self._seller_organization_ids(
            user_id,
            organization_id=None,
        )
        provider_ids = await self._provider_ids_for_seller_orgs(seller_org_ids)
        return await self._list_for_provider_ids(provider_ids, filters=filters)

    async def get_accessible(
        self,
        product_id: UUID,
        user_id: UUID,
        *,
        organization_id: UUID | None = None,
        detail: str = "Product not found",
    ) -> Product:
        if organization_id is not None:
            return await self.get_for_seller_organization(
                product_id,
                organization_id,
                detail=detail,
            )
        seller_org_ids = await self._seller_organization_ids(
            user_id,
            organization_id=None,
        )
        provider_ids = await self._provider_ids_for_seller_orgs(seller_org_ids)
        return await self._get_for_provider_ids(
            product_id,
            provider_ids,
            detail=detail,
        )
