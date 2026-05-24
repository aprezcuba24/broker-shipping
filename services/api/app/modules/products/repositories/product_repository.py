from app.modules.products.models import Product
from app.lib.org_scoped_resource import OrgScopedRepositoryMixin


class ProductRepository(OrgScopedRepositoryMixin[Product]):
    pass
