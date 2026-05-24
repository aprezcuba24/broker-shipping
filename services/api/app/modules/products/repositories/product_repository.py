from app.modules.products.models import Product
from app.lib.persistence import OrgScopedRepositoryMixin


class ProductRepository(OrgScopedRepositoryMixin[Product]):
    pass
