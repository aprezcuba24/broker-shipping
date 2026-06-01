from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel

from app.lib.persistence import BaseService, FilterSpec, OrgScopedServiceMixin
from app.modules.organization.models import Organization, OrganizationType
from app.modules.organization.services.provider_seller_link_service import (
    ProviderSellerLinkService,
)
from app.modules.products.events import ProductCreated
from app.modules.products.models import PRODUCT_LIST_FILTER_SPEC, Product


class ProductService(OrgScopedServiceMixin[Product], BaseService[Product]):
    def __init__(
        self,
        repository,
        dispatcher,
        post_commit,
        link_service: ProviderSellerLinkService,
    ) -> None:
        super().__init__(repository, dispatcher, post_commit)
        self._link_service = link_service

    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Product.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Product.model_fields.keys()) - Product.IMMUTABLE_FIELDS

    @classmethod
    def list_filter_spec(cls) -> FilterSpec[Product]:
        return PRODUCT_LIST_FILTER_SPEC

    async def list_accessible(
        self,
        org: Organization,
        *,
        filters: BaseModel | None = None,
    ) -> Sequence[Product]:
        if org.type == OrganizationType.provider:
            return await self.list_for_organization(org.id, filters=filters)
        provider_ids = await self._link_service.list_active_provider_ids(org.id)
        return await self._repo.list_by_organization_ids(  # type: ignore[attr-defined]
            provider_ids,
            filters=filters,
            filter_spec=type(self).list_filter_spec(),
        )

    async def get_accessible(
        self,
        product_id: UUID,
        org: Organization,
        *,
        detail: str = "Product not found",
    ) -> Product:
        if org.type == OrganizationType.provider:
            return await self.get_or_404_for_organization(product_id, org.id, detail=detail)
        provider_ids = await self._link_service.list_active_provider_ids(org.id)
        entity = await self._repo.get_by_id_for_organization_ids(  # type: ignore[attr-defined]
            product_id,
            provider_ids,
        )
        if entity is None:
            raise HTTPException(status_code=404, detail=detail)
        await self.on_get(entity)
        return entity

    async def on_create(self, entity: Product) -> None:
        self.post_commit_emit(ProductCreated(entity=entity))
