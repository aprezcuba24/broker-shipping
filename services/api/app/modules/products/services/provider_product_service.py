from app.lib.persistence import OrgScopedServiceMixin
from app.modules.products.models import Product
from app.modules.products.services.product_service_base import ProductServiceBase


class ProviderProductService(ProductServiceBase, OrgScopedServiceMixin[Product]):
    pass
