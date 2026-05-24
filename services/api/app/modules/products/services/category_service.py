from app.lib.persistence import BaseService, OrgScopedServiceMixin
from app.modules.products.models import Category


class CategoryService(OrgScopedServiceMixin[Category], BaseService[Category]):
    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Category.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Category.model_fields.keys()) - Category.IMMUTABLE_FIELDS
