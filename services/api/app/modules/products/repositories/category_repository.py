from app.modules.products.models import Category
from app.lib.persistence import OrgScopedRepositoryMixin


class CategoryRepository(OrgScopedRepositoryMixin[Category]):
    pass
