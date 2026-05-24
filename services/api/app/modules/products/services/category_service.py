from app.lib.base_service import BaseService
from app.modules.products.models import Category


class CategoryService(BaseService[Category]):
    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Category.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Category.model_fields.keys()) - Category.IMMUTABLE_FIELDS
