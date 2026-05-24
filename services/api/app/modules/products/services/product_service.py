from app.lib.persistence import BaseService, OrgScopedServiceMixin
from app.modules.products.events import ProductCreated
from app.modules.products.models import Product


class ProductService(OrgScopedServiceMixin[Product], BaseService[Product]):
    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Product.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Product.model_fields.keys()) - Product.IMMUTABLE_FIELDS

    async def on_create(self, entity: Product) -> None:
        self.post_commit_emit(ProductCreated(entity=entity))
