from app.modules.products.models import Category
from app.lib.org_scoped_resource import OrgScopedRepositoryMixin


class CategoryRepository(OrgScopedRepositoryMixin[Category]):
    pass
